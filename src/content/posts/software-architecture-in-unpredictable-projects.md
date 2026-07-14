---
title: "Sketching out the extremes: an approach to designing software architectures in highly unpredictable projects"
date: "2024-08-18"
tags: ["architecture", "microservices"]
excerpt: "When requirements are genuinely unknowable, picking an architecture up front is a guess. Sketching the two extreme designs first turns that guess into a decision you can defend."
cover: "/blog/covers/software-architecture-in-unpredictable-projects.svg"
coverAlt: "A spectrum axis between a monolith and distributed services"
---

Imagine a scenario: a fresh, ambitious project with enormous potential but limited resources. The stakes are high, and the product needs to hit the market as soon as possible to validate its potential and seize the opportunity. The roadmap is hazy, making flexibility crucial.

Classic story until now. But here’s where things get spicy: the company that started the project has a huge community ready to jump on this new product they’ve been advertising for months. Thus, at the initial beta release, the system must be prepared to jump from 10 internal people testing it to anywhere from 20-100k daily active users and millions of events per hour.

This mix of conditions creates a particular set of requirements:
- the system must be **simple** enough to be handled by a few devs at the beginning, with short iteration time and cost-effectiveness being key
- it must be **scalable** enough to handle the spike of users around the initial release date
- it must be **flexible** enough to permit a rapid move toward scalability later on, delivering more and more complex features along the way

## The process
The first step was to create an architecture that would satisfy all these requirements.

As a preparation, I read and re-read the following books:
- [Fundamentals of Software Architecture: An Engineering Approach](https://www.amazon.com/Fundamentals-Software-Architecture-Comprehensive-Characteristics/dp/1492043451)
- [Building Microservices](https://www.amazon.com/Building-Microservices-Sam-Newman-ebook/dp/B09B5L4NVT)
- [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321)

Drawing on the insights from these resources, along with my prior experience, I knew that some form of distributed architecture would be essential to handle the expected traffic.

Roughly speaking, I followed these steps to arrive at an initial sketch of how the system would look like:
1. Analyse requirements and **gather events** that will need to be handled by the system
2. Group those events into **domain boundaries**
3. Identify **architecture characteristics** (scalability, security, robustness - these kinds of things)

That initial sketch looked like this (in order to protect the intellectual property of the company, I anonymized all event and module names, keeping only the shape of the sketches):

![Diagram first version](/blog/software-architecture-in-unpredictable-projects/initial-sketch.png)
[Readable version here](https://drive.google.com/file/d/1tWDXhaaZA0qOCKnevK51Vf8-p38ZBVsf/view?usp=sharing)

After lots of refinement and discussion sessions, two things became clear:
- one big chunk of code (i.e a monolithic architecture) wouldn’t fit our scalability and flexibility needs
- a full-blown microservice architecture would be too complex and costly at this stage of the game

So, as with most things in life, the solution was somewhere in the middle. Finding that middle was now the challenge.

Here’s where the approach that I’m proposing comes into play:

## Sketching out the extremes

Initially, the mindset was to design the simplest architecture that would satisfy our requirements and see if I noticed any specific areas of risk/improvement.

The simplest architecture I could think of was a **modular monolith**, where those modules would be as separated and clearly defined as possible. It looked something like this:

![Architecture V1](/blog/software-architecture-in-unpredictable-projects/architecture-v1.png)
[Readable version here](https://drive.google.com/file/d/1CxW2T8DDMv0hw5KmKpHxwXbBdkySZx-P/view?usp=sharing)

The thing that I thought would be the “secret sauce” here was the **data access library**, a library shared between all modules, it would sit in front of the database layer and would be designed in such a way that extracting a module into its own microservice would take as little effort as possible, and we would only have to tamper with the shared library.

As a bonus, and to be prepared “even more” for the move towards microservices, I was planning to deploy each module into its own independent function on the cloud infrastructure we were planning to use.

After analyzing the approach a little more, two things became obvious:
- implementing the “secret sauce” library in the way that I imagined wasn’t realistic, and it would lead to lots of complications
- deploying modules in different containers that accessed each other's databases risked creating a **"Distributed Monolith"**—a problematic architecture that combines the worst aspects of monolithic and distributed systems.

So, since I went to one extreme, i.e. the cheapest/fastest one, I thought it would be interesting to go to the other one as well:

> _What would the architecture look like, if we had all the resources we needed to create it?_


After some more sketching, I arrived at this rough design of a microservice architecture for our system (I only highlighted some the inter-service events here):

![Architecture V2](/blog/software-architecture-in-unpredictable-projects/architecture-v2.png)
[Readable version here](https://drive.google.com/file/d/1CMwSF_n2WJBvUIt6QmJllG6QEn_bnKRX/view?usp=sharing)

In this version, we have some clear advantages:
- **individual scalability** of each module, based on loads
- clear **ownership of the data**
- each module can be **independently deployed**

However, these advantages come at a cost: **complexity**.

Most of that complexity came from the inter-service communication. In V1 of the architecture, if module C needs data that is stored in database E, it can directly access it via the shared library. In this version, it has to request the data from Module C **over the network** - which adds more points of failure and makes tracking and debugging more difficult.

But even though this wasn’t the best solution for our current situation, it led us to some important insights based on which we built the actual architecture of the system.

## The solution

After taking a closer look, we noticed that most of the inter-service communication was happening between 3 of the 6 modules: Module C, Module D, and Module F. If the network communication between those services was somehow taken out of the picture, the remaining microservices would have a reasonable number of events and requests to share between them.

So that is exactly what we did: compressed the 3 highly interrelated modules into a single modular microservice, and transformed the other modules into their own microservices.

After some more tweaking and refining, this is the architecture we’ve come to:

![Architecture V3](/blog/software-architecture-in-unpredictable-projects/architecture-v3.png)
[Readable version here](https://drive.google.com/file/d/1ReSScUSipffLwXTS13esrxdbPPiBmQYI/view?usp=sharing)

Here are the advantages of this architecture:
- it retained the **scalability advantages of microservices**
- the downsides of inter-service communication were reduced to a manageable level, enough so that our small initial team could **implement the architecture in an efficient manner**
- the "big" microservice was **implemented modularly**, allowing for future extraction of individual modules if needed
- the established microservice framework meant there would be **less friction** when splitting additional components into new microservices

## Conclusion
Oftentimes, as software developers and architects, we are expected to come up with the ideal solution for any set of circumstances, requirements, or problems. We are aware, however, that everything in software development is a tradeoff.

While this little story isn’t about promoting any specific type of software architecture, its purpose is to showcase a promising strategy for building software architectures, and it sounds like this:

> _When trying to figure out where exactly to stop between two extremes, a good starting point is to sketch out how both of these extremes would look like._

In terms of software architecture, designing the cheapest and fastest architecture that would sort of satisfy the requirements, and putting it next to the most comprehensive and scalable solution can be very insightful. It can bring a better understanding of the system, its risks, and possibilities - as well as provide a clearer general direction for the product as a whole.

In our case, this strategy showed us how a little tweak in the way we were organizing our components allowed us to aim much closer to the “ideal” microservice architecture than we had initially thought was possible.

_What insights would such an approach bring to your project and team?_
