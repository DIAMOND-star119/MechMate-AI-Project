# **MechMate AI — Product Requirements Document (PRD)**

**Product status:** Concept / Early Product Definition  
**Primary audience:** Students in Mathematics, Physics, Engineering, and other calculation-heavy technical fields  
**Product principle:** *Help students understand formulas and their relationships, not merely obtain answers.*

---

## **1\. Product Vision**

**MechMate AI** is an AI-powered learning companion designed to help students understand calculation-heavy subjects through structured, contextual learning.

Instead of requiring students to search through lecture notes, textbooks, websites, or multiple resources to understand a formula, MechMate brings the relevant concepts, formulas, examples, and practice into one learning experience.

The product should answer not only:

> **“What is the answer?”**

but also:

> **“What does this formula mean, how is it used, and how does it connect to what I'm learning?”**

---

# **2\. Target Users**

### **Primary users**

Students studying calculation-heavy subjects, initially focusing on:

* Mathematics  
* Physics  
* Engineering

### **Typical user**

A student who:

* Understands some concepts but struggles to connect formulas.  
* Spends considerable time searching for explanations.  
* Wants concise explanations rather than reading entire chapters.  
* Needs examples to understand formula application.  
* Wants to practise after learning.  
* Sometimes encounters a new problem that depends on something previously studied.

---

# **3\. Core Problem**

Students often encounter a formula without fully understanding:

* What it represents.  
* What each variable means.  
* The units involved.  
* When the formula should be used.  
* How it applies to real problems.  
* How it connects to concepts they have previously learned.

Finding this information often requires moving between notes, textbooks, websites, calculators, and other resources.

MechMate should reduce this fragmentation by providing a **structured learning experience around the topic the student is studying.**

---

# **4\. Product Goals**

### **Primary goals**

1. Make formulas easier to understand.  
2. Help students connect concepts across topics.  
3. Demonstrate practical application through examples.  
4. Develop understanding through progressively challenging practice.  
5. Identify strengths and areas requiring clarification.  
6. Allow students to learn at their own pace.  
7. Personalize learning based on demonstrated progress.

### **Non-goal**

MechMate should **not position itself primarily as an answer-generating calculator**.

The educational experience comes first.

---

# **5\. Core User Journey**

The primary journey is:

**Search → Select topic → Select subtopic → Learn → Explore formulas → See examples → Practise → Review → Retest or continue**

---

## **6\. Topic Discovery**

The student can immediately search for a topic without completing lengthy onboarding.

For example:

> **Kinematics**

MechMate presents relevant subtopics such as:

* Displacement  
* Velocity  
* Acceleration  
* Equations of motion  
* Projectile motion

### **Recommended learning path**

MechMate recommends an order based on conceptual relationships.

However, the student can freely choose another subtopic.

If the selected topic depends on previous knowledge, MechMate can warn the student without preventing them from continuing.

---

# **7\. Topic Learning Experience**

Each subtopic follows a consistent structure.

### **7.1 Concept**

A concise explanation establishing what the concept means.

The explanation should prioritize:

* Clarity  
* Simplicity  
* Relevance

Students should not be overwhelmed with unnecessary information.

---

### **7.2 Formula Overview**

The relevant formulas are presented clearly.

For each formula, the student immediately sees:

* Formula  
* Meaning of each symbol  
* Unit associated with each symbol

The initial presentation remains concise.

Additional information can be accessed when needed.

---

### **7.3 Formula Details**

Students can request additional information such as:

* What the formula means.  
* When it should be used.  
* How it applies.  
* A deeper explanation.

This prevents the main learning interface from becoming unnecessarily dense.

---

# **8\. Examples**

Each important formula should have **progressive examples**.

### **Example 1 — Basic**

A straightforward application demonstrating the fundamental use of the formula.

### **Example 2 — More challenging**

A less obvious application showing the student that the formula can be used in a different situation.

The objective is to move the student from:

**“I recognize the formula.”**

to:

**“I know when and how to use the formula.”**

---

# **9\. Practice System**

After learning and examples, MechMate provides practice.

### **Adaptive difficulty**

Practice begins at an accessible level.

As the student demonstrates understanding, difficulty increases.

If the student struggles, MechMate should respond appropriately rather than simply continuing to increase difficulty.

The purpose is to determine whether the student actually understands the material.

---

# **10\. Results & Feedback**

After practice, MechMate presents:

### **Results**

The student can see how they performed.

### **Corrections**

For incorrect answers, MechMate provides:

* The correct answer.  
* A concise explanation of the mistake.

The default correction should **not overwhelm the student with a long solution**.

### **Strengths**

MechMate identifies concepts or areas where the student performed well.

This helps the student understand:

> **“What do I already know?”**

rather than focusing exclusively on mistakes.

---

# **11\. Retesting**

After corrections, MechMate asks the student whether they need clearer explanations for the questions they missed.

If the student chooses to review:

**Correction → clearer explanation → retest**

The retest should establish whether the student has actually understood the concept after the correction.

If the student demonstrates understanding, they can proceed.

---

# **12\. Progression**

After completing a subtopic, the student can:

**Continue to the next recommended phase**

or explore another available topic.

MechMate recommends what to study next but does not force the student to follow the recommendation.

---

# **13\. Contextual Memory Refreshers**

This is an important differentiating feature.

MechMate should **not constantly interrupt lessons with reminders of old material.**

Instead, when a student encounters a **new topic or question that relies on previously learned knowledge**, MechMate can briefly refresh the relevant concept.

Example:

> **Quick refresh — Velocity Components**  
> vx=ucos⁡θv\_x \= u\\cos\\theta  
> vy=usin⁡θv\_y \= u\\sin\\theta

Then MechMate returns to the current question.

The refresher should be:

* Short  
* Relevant  
* Easy to understand  
* Directly connected to the current problem

---

# **14\. Student Questions**

Students should be able to ask questions while learning.

Example:

> **Student:** Why is the horizontal acceleration zero?

MechMate should:

1. Answer the student's exact question.  
2. Briefly connect the explanation to the relevant concept or formula being studied.

This keeps the interaction educational rather than turning MechMate into a generic chatbot.

---

# **15\. Personalization**

MechMate should remember the student's learning progress.

It should distinguish between:

* Topics the student has encountered.  
* Concepts they have demonstrated understanding of.  
* Areas where they struggled.  
* Areas where they performed strongly.

This information can influence future recommendations and refreshers.

For example, a student who has already demonstrated strong understanding of velocity should not repeatedly receive an entire introductory lesson on velocity unless they request it.

---

# **16\. Onboarding**

MechMate should use **optional personalization**.

A student can immediately search for a topic without setup.

They can optionally provide:

* Field/course  
* Academic level

This information improves recommendations without creating unnecessary friction.

---

# **17\. Optional Deep-Dive Features**

Some features should remain optional so the core experience stays focused.

### **Formula derivation**

After learning a formula, MechMate can ask:

> **Would you like to see how this formula is derived?**

### **Related formulas**

MechMate can ask:

> **Would you like to explore other formulas connected to this one?**

This allows students who want deeper understanding to continue without overwhelming students who simply need the core concept.

---

# **18\. End-of-Lesson Application**

Near the end of a learning experience, MechMate should offer:

> **Would you like to answer a few questions to see how these formulas are applied?**

The student can choose to proceed.

The application experience should present the **formula and an example/application one after another**, reinforcing the relationship between theory and use.

---

# **19\. Initial Subject Scope**

The first product scope should focus deeply on:

### **Mathematics**

### **Physics**

### **Engineering**

The product should prioritize **quality and depth** rather than attempting to cover every technical subject immediately.

Additional subjects can be introduced as the product matures.

---

# **20\. Product Principles**

MechMate should consistently follow these principles:

### **1\. Understanding before answers**

Don't simply produce an answer when teaching is more valuable.

### **2\. Concise by default**

Give students what they need first; allow them to go deeper when they want.

### **3\. Context matters**

Bring previous knowledge back only when it is relevant to the student's current learning.

### **4\. Student autonomy**

Recommendations guide students; they do not control their learning path.

### **5\. Progressive difficulty**

Move from basic understanding to increasingly challenging application.

### **6\. Learn → Apply → Practise → Reflect**

Every major learning experience should reinforce this cycle.

### **7\. Don't punish curiosity**

Students should be able to jump between topics and ask questions even when they haven't followed the recommended path.

---

# **21\. Proposed MVP**

For the initial version, I would keep MechMate focused on one complete experience rather than attempting to build the entire long-term vision.

The MVP should prove that MechMate can successfully take a student through:

> **Topic → Subtopic → Concept → Formula → Symbols/Units → Basic Example → Challenging Example → Adaptive Practice → Results → Corrections → Retest/Continue**

Alongside that core experience, the MVP should include:

* Topic search  
* Recommended subtopics  
* Student-controlled navigation  
* Student questions  
* Basic learning progress  
* Contextual memory refreshers  
* Optional formula derivation  
* Optional related-formula exploration

If this core loop works exceptionally well, **additional tools can be layered onto it later** without changing MechMate's fundamental identity.

---

# **22\. Product Success**

The fundamental question for MechMate is not:

> **“Did the student get the answer?”**

It is:

> **“Did the student understand enough to apply the concept themselves?”**

That should be the standard against which future features are evaluated.

**MechMate AI's core promise:**

> **Search for a topic. Understand the formulas. See how they are applied. Practice them. Learn from your mistakes. Move forward with confidence.**

