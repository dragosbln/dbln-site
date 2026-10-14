---
title: "Reliability at the core: five ground rules for building an agent loop"
date: "2026-10-14"
tags: ["ai", "agents", "reliability", "architecture"]
excerpt: "Five ground rules for building an AI agent loop with reliability at its core, learned building Kept: lay down the state machine before the code, separate the loop runner from the host, turn errors into outcomes, keep the history atomic, and assert every transition three ways."
cover: "/blog/covers/5-rules-for-building-reliable-ai-agents.svg"
coverAlt: "A host box labelled HTTP and eval, stamped one turn at a time, wraps a dark agent loop block that takes message and history and returns outcome and history. A customerInput message enters from the left. Three outcome pills exit on the right: replied in teal, failed in red, conversation_full dashed. Below the loop sit a history store and a trace. The caption reads: the loop assumes; the host guarantees."
# TODO(dragos): add the dev.to URL of this article's cross-post (devto: "…")
---

A couple of months ago I started developing Kept, an open-source post-order support agent for e-commerce stores, that can perform sensitive actions (refunds, returns). Because of those sensitive actions, **reliability** has to be a core part of Kept. So, beyond getting it ready for production, Kept is my excuse for investing time and effort into researching what it means for an agent to have _reliability at its core_.

In the previous article, I described my first move: observability-first. Now the journey reached the agent loop.

My objective with this article is to highlight 5 high-value ground rules that came out of my reliability-first approach, and are usually missed when building agents (and that I would've missed as well, if not for my focus on reliability).

Some of the rules are about design, some are about implementation details. I recognize that today agents are built by other agents, and people rarely touch design or implementation, so this article is not a tutorial, but rather a resource meant to:
- help you understand reliable agent design;
- be provided as extra context when Claude builds your next agent;
- serve as a guideline if you decide to review what your coding agent did;
- offer a list of potential design faults for when your agent misbehaves and you have to debug it.

## Short context - what is an agent?

An agent is basically a loop that sends messages to an LLM, performs the tool calls if the model asks for them, and sends the tool results back to the model, repeating that process until the model decides the task is accomplished and is ready to provide the final answer. Every model call is a round, and every round, tool call and tool result is persisted in the conversation history, which is then sent with every new round. A turn is one customer message in, one outcome out, made of one or more rounds.

A useful resource if you want to build a quick agent yourself is Amp Code's [How to Build an Agent](https://ampcode.com/notes/how-to-build-an-agent). I followed the tutorial, and I find it insightful and easy to follow and digest.

### How I implemented the Kept agent loop

I've put my reliability glasses on, started with some research on the topic, had a few back-and-forths with Fable and laid down the state machine (more on that later). Then I went ahead with the code.

As I stated before, my objective wasn't just to get the agent in production, but also to understand what reliability means for an agent. And since the agent loop is a core part of it, I decided to write the initial version of the code by hand, from the state machine, with no AI code at all. Then I sent it over to Claude for review, where I fixed the mistakes and inconsistencies that slipped through.

After this, I started looking back at the design and code for reliability holes, which led me to the rules I'm about to describe in this article.

## Observability-first

I already covered my approach of building the entire tracing layer before any code to the agent loop in the previous article, [Putting the trace before the loop](/blog/building-an-ai-agent-observability-first), so I won't spend more time on it here. However, it's worth bringing it up from a different angle. In the previous article, I supposed the approach will be valuable when building the agent loop.

Now that I've built it, I can confirm it was. Beyond the head start on the design [I described there](/blog/building-an-ai-agent-observability-first#benefit-3-you-get-a-first-sketch-of-your-architecture-for-free), three things showed up only once the loop was running:
- **The trace caught loop bugs before any test named them.** Most notably, the open-span guard caught a client that rejected and left its model-call span dangling.
- **It made a stricter rule affordable.** As I'll describe later, to keep the conversation history clean, I decided a failed turn hands the conversation back untouched. I could only do that because I had a safe place to save the dropped rounds, in the model-call span.
- **The tests read the trace from day one.** Every loop test asserts outcome, persisted history and trace shape ([code here](https://github.com/dragosbln/kept/blob/v0.3.0/packages/core/src/agent/loop.test.ts)), so when the eval runner arrived it read the same model with no new instrumentation.

The [predicted drawback](/blog/building-an-ai-agent-observability-first#drawback-1-youll-have-to-revise-the-tracing-layer-later) was real, and small. The tracing layer did need revision once the loop existed, but it was one review session, rather than a big rewrite.

Up next I'll present the ground rules I recommend for building reliability into the core of an agent. For each rule, I will point out the _reliability lens_ question they address, to make sure we keep your eyes on the bigger picture, while navigating through the weeds.

## 1. State machine before the code

> Reliability lens: Do I know every way a turn can end, or am I waiting for production to tell me?

The first important decision, which turned out very helpful for the reliability aspect, was laying down the state machine before committing any code. It gave me a structured way to consider edge cases - which events could fire in what state of the loop - as well as the terminals that would cover these edge cases appropriately.

My approach for the state machine was:
1. Make a list with all the events:
    - Using the question: "**who** does the loop wait on and **what** can each case hand back?"
    - `runTurn(msg, history)`, `model_transport_error`, `model_responded(end_turn | tool_use | refusal | max_tokens | context_window_exceeded | unknown)`, `tool_settled(result)`
2. Define the states
    - Using the question: "**where** does the loop wait for something?"
    - `awaiting_model`, `executing_tools`
3. Construct the state machine table
    - Events on the row, states for columns, transitions in every resulting cell.
    - Whenever a transition is impossible, I noted why (the invariant) and what enforces it. This is where the idea of a separate host came up, as we'll explore in rule #2.
4. Define the terminals
    - I marked every table cell from which the loop cannot make another model call. Each became a terminal and a member of the turn outcome the trace already required. ⊗ marks a terminal.
    - `replied` ⊗, `failed(internal | max_rounds | refusal | max_tokens | unknown_stop_reason | empty_reply)` ⊗, `conversation_full` ⊗

I ended up with the following table:

![The runTurn state machine as a table. Rows are the events: runTurn, transport_error, tool_use with rounds left, with the budget spent or with no tool calls, end_turn with and without text, refusal, max_tokens, an unknown stop reason, context_window_exceeded and tools_settled. Columns are the states: start, awaiting_model and executing_tools. Each cell names the next state or terminal and the actions taken, such as ending the model-call span, appending the assistant message or opening one tool span per call. Impossible cells name the invariant that rules them out, such as one turn per conversation at a time, enforced by the host's conversation lock, or no call in flight.](/blog/5-rules-for-building-reliable-ai-agents/state-machine.png)

This was the starting point for the first handwritten version of the loop. What I did from here was just translating the state machine into code: the terminals became a union type, the table became one `switch` over the model's response inside a `for` loop, one iteration per round, and the impossible cells became the preconditions in the function's header comment.

## 2. Separate the loop runner from the host

> Reliability lens: What does my agent loop take for granted, and who guarantees it?

The next important decision was separation of concerns. The loop had a bunch of invariants from the state machine, most importantly that there's only one request on a conversation at a time. That required a lock on the conversations, and folding that logic into the loop runner would've made it overly complex and hard to test.

Instead, I turned those invariants into preconditions for the loop runner, and delegated the responsibility of ensuring them to a new component, **the host**.

The host would sit next to the HTTP handler and hold the conversation locking mechanism. It turned out to be a great place to also:
- Read the environment to build the runner config (validating at boot so nothing throws per request);
- Initialize dependencies;
- Resolve conversation identity before the lock;
- Persist turns into the conversation history;
- Ensure traces are ended and exported in a `finally` block;
- And wrap the responses into the envelope the HTTP handler would need.

With the host handling all these concerns, the loop runner can maintain a clear responsibility that's easy to test and reason about: take one customer message and a history, drive the model and the tools until a terminal is reached, and return the outcome plus the history to persist.

The approach greatly benefits evals as well. The eval runner is just a second host: it composes the same service with its own dependencies, a seeded backend, a clock set per case, and an in-memory trace collector instead of the Langfuse exporter, so each case runs the untouched loop inside a world built for it.

![fig. the host guarantees the preconditions, the loop runner holds the invariants; an eval is a second host on the same runner.](/blog/5-rules-for-building-reliable-ai-agents/loop-runner-and-host.svg)

## 3. Errors become outcomes

> Reliability lens: Are my traces telling the truth about an error?

An important part for the reliability of any system is what you do when the code throws an error. For an agent, I found the best approach to be turning those errors into outcomes.

An unhandled throw in the code that short-circuits the execution of the turn can leave your conversation history in an inconsistent state, break the handling of future messages and **leave your traces incomplete**.

For example, context overflow can surface as a 400 error in the Anthropic API. If you allow it to surface as an error, the agent will allow more messages in the conversation and each of them will fail, with no trace record, or a vague one at best. Instead, it's better to turn the 400 into a `conversation_full` outcome, so the host can say the conversation is full and not accept new messages, and the trace can properly record it.

In Kept, I decided that errors are handled at 3 layers: the tools run in an executor that settles everything, the model client normalizes everything, and the loop catches what is left as an internal failure and logs it.

Fail-fast is reserved for the trace misuse guards (span started after end, span left in_progress at trace.end) and boot-time config validation, with tests around them ensuring they will throw in dev before reaching any production user.

### Use the trace as a lifecycle guard, not just a log

One particularly important aspect of error handling in agents is how you make sure a throw in your code doesn't swallow spans and leave traces incomplete. A useful pattern for addressing this risk is to enforce the invariant that an opened span must be closed in the tracing layer.

In Kept, spans live in an in-memory trace, and when the host calls `trace.end()` at the end of the turn, every span still open is a lifecycle violation. In dev, that is a throw. In production it becomes a reserved status, `undetermined`, which is deliberately neither `error` nor absent: the step never reported failure, and a missing span would look like a step that never ran. I wrote more about this approach [here](/blog/building-an-ai-agent-observability-first#3-lifecycle-and-end-states). The guard earned its place during the loop build by catching a real bug, as I mentioned above.

### Keep the failure alphabet closed

A common trap when handling errors is to define a few error types (`'timeout' | 'network' | 'validation'`), and wrap everything else in a generic `internal` or `unexpected` error type.

But if 80% of your errors (or even a small percentage of highly impactful ones) fall into a generic `internal` bucket, that's just as harmful for observability (and, in turn, reliability) as the case of incomplete traces I just described.

Make sure your failure set is closed and pay particular attention to what you can pull out of the generic `internal` bucket into its own kind that will shed some light when you encounter it in your tracing dashboard. Also, make sure that a new provider stop reason that's not handled fails at build and doesn't slip through. In TypeScript, you can do this by ending a switch with:
```ts
switch(response){
    //...
    default:
        response satisfies never;
}
```

A particular case for Kept was my initial `unknown` terminal. During implementation I realised it covered two different events: a stop reason the client did not recognise _and_ a successful `end_turn` with no text in it. I decided to split it into `unknown_stop_reason` and `empty_reply`. An eval that sees only `unknown` cannot tell which fix to ask for.

## 4. History is atomic

> Reliability lens: Can a failure poison the conversation history I'm sending to the model?

Every model call in our agent requires us to send over the entire conversation history, so an important part of making our agent reliable is to keep that history clean and consistent, which can be trickier than it sounds. For example, we can end up with a corrupted history if:
- The model hits `max_tokens` halfway through a tool call: the truncated `tool_use` lands in history with no `tool_result` to answer it, and the provider rejects every call from then on.
- The transport fails after the customer message was appended: the retry appends it again, and the model now answers a customer who said the same thing twice.
- The model refuses with empty content and the refusal is stored as a reply: the customer sees nothing, and the next call carries an empty assistant message the provider may reject.

A simple way to avoid such edge cases is to keep the history atomic: a turn commits all of its messages or none. A failed terminal returns the history exactly as it was, and the trace records the dropped messages. This way, a failed turn doesn’t poison the conversation, but it doesn’t vanish either: we can still see what the agent tried to do in the traces.

### What atomicity cannot undo: a side effect already executed

One particular history-related failure I encountered in Kept is crossing the round limit budget on tool calls. The model can request a tool call on the last round the budget allows, and technically the tool call itself still fits the budget. However, the loop still needs an extra round for the model to process the tool response, which it can't do anymore, leaving the history poisoned.

To avoid having to discard a tool (or even revert its effects) because the model can't process the request anymore, I placed the round limit check before firing the tool call, not after.

Things get more complicated with context budgets. A pre-check is an estimate at best: the count depends on the provider's tokenizer, the tool results are unknown until the tools run, and the reply still needs room. In Kept, overflow is detected after the fact, and becomes `conversation_full`, its own terminal with history unchanged, so the host can close the conversation instead of failing every later message. The practical lever is upstream: bound how much a round can add, through result sizes and retrieval top-k, so growth stays predictable.

## 5. Assert each transition 3 ways

> Reliability lens: Do my tests check what the agent did, or only what it said?

Since I decided to build the state machine before writing the loop, I already had a starting point for your unit tests: each table cell is a test fixture.

Either way tests are organized, it's important to ensure they assert all three relevant layers of your agent. They shouldn't just stop at the _outcome_ ("customer response quoted article 3.1"). They should also check what was persisted in the _conversation history_ and, more importantly, _the shape of the trace_, and whether it contains what we'd expect to see there.

This is a good rehearsal for evals, which will have to evaluate the whole picture at all 3 levels, if we hope to make them valuable, accurate and trustworthy. Here's an [example test from Kept](https://github.com/dragosbln/kept/blob/v0.3.0/packages/core/src/agent/loop.test.ts#L425-L444), doing the 3-way assertions.

### Provider contract suite

On the same testing note, the LLM provider earns a special place. The model calls are a core part of an agent, so the model client becomes a sensitive piece that's worth particular attention when testing.

I created a provider-agnostic interface for the LLM client and gave it a shared contract suite that every provider-specific implementation has to pass. It covered every way a call can end: a reply, parallel tool calls, max tokens, refusal, an unknown stop reason, overflow on request and mid-generation, timeout, a 500, a network failure.

The suite is what I'd rerun when an SDK or a model changes under me, and found it particularly valuable when adding a new provider: having an interface enforced by the same test suite saved me from hunting down peculiar inconsistencies in provider behaviors.

For Kept, the provider contract suite caught two drift bugs this way before any conversation did. [Here's the code](https://github.com/dragosbln/kept/blob/v0.3.0/packages/core/src/model/client.contract.ts#L37-L48).

## A note on tools

As you might have noticed, I kept tools out of the discussion in this article, even though they are an important part of an agent's reliability, or lack thereof. In fact, in my experience, the design of the tools and the way agents interact with them is the biggest source of unreliable behavior in an agentic system.

For this article, I decided to stick to the basic design of an agent loop. Suffice to say that tools should run inside an executor that settles every call to a result the loop can hand the model, whatever happened inside.

I'll have a separate article dedicated to tools, covering why a tool result has three states rather than two, who decides whether the model may retry, and why every result has one face for the model and another for the trace. Keep an eye on [my blog](/blog) for that.

## Conclusion

As agentic products move from demos to places where a wrong action costs money, it becomes more important than ever to know what your agent does when things don’t go as planned.

We’re not the ones writing the code anymore. Sometimes we’re not even designing the architecture or approving the PRs. But we’re still the ones that have to take responsibility for what our agents do. And when one of them misbehaves in production, our engineering instinct is still the most valuable resource we can rely on. In this article, I’ve provided five rules to sharpen that instinct. The same five lines work as a brief for your coding agent and a checklist for reviewing what it built.

How do you design your agent for reliability? And what gives you the confidence to put your name behind it?
