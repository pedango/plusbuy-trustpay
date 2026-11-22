# TASK: Generate Complete Technical Documentation and System Architecture for PlusBuy and TrustPay

Act as a Senior Software Architect, Systems Analyst, Technical Documentation Engineer and Database Architect.

Your task is to thoroughly inspect my existing repository and generate comprehensive, professional software engineering documentation for two interconnected systems:

1. **PlusBuy** – The main e-commerce application.
2. **TrustPay** – A separate payment and escrow service that operates within the PlusBuy ecosystem.

I have already created a folder named `DOCUMENTATION` in the root directory of the repository.

**IMPORTANT: Every document, diagram, architecture file and supporting documentation generated for this task MUST be placed inside this existing `DOCUMENTATION` folder. Do not create another documentation folder elsewhere. Do not scatter documentation files across the repository.**

The documentation should be detailed enough for another software developer, software architect or technical team to understand the systems, their implementation, architecture, business logic and integration.

---

# PART 1: SOURCE OF TRUTH AND IMPLEMENTATION PRECEDENCE

**THIS SECTION TAKES PRIORITY OVER ALL OTHER PROJECT DESCRIPTIONS, EXAMPLES, REQUIREMENTS, ASSUMPTIONS AND INSTRUCTIONS IN THIS PROMPT.**

The actual implementation of PlusBuy and TrustPay in the repository is the primary and authoritative source of truth for all documentation describing existing functionality.

The project descriptions and scenarios provided in this prompt are intended to explain the general purpose and business objectives of the applications. They must not override what the actual system does.

You MUST document the actual behaviour and capabilities of the existing applications, even when they differ from the descriptions, examples or requirements provided in this prompt.

### 1.1 Implementation takes precedence over descriptions

If any functionality described in this prompt differs from the actual implementation, ignore the description and document what the application actually does.

For example:

- If this prompt describes customers purchasing only one item at a time, but the actual application allows customers to purchase multiple items or quantities in a single order, document the actual multiple-item purchasing functionality.
- If this prompt says customers can perform a particular action but the application does not currently support it, do not document that action as an implemented feature.
- If this prompt describes sellers performing certain operations but the actual seller dashboard supports additional or different operations, document what the seller can actually do.
- If this prompt describes administrator capabilities that are not present in the actual system, do not claim those capabilities exist.
- If the application implements additional features that are not mentioned in this prompt, document them.
- If the actual database uses a different structure from what is assumed in this prompt, document the actual database structure.
- If the actual payment workflow differs from the proposed escrow workflow, document the implemented workflow and clearly identify the proposed workflow separately.
- If the application uses a different authentication, authorisation or order-management approach from the one described here, document the actual implementation.

### 1.2 Customer, seller and administrator capabilities

Pay particular attention to what each user role can actually do.

Inspect the frontend interfaces, backend API routes, server actions, permissions, database models and business logic to establish the actual capabilities of:

**Customers**
- What customers can view.
- What customers can create.
- What customers can purchase.
- Whether they can purchase one or multiple products.
- Whether they can purchase multiple quantities of the same product.
- What checkout options are available.
- What order-management actions they can perform.
- What payment and transaction information they can access.
- What delivery and confirmation actions they can perform.
- What account-management features are available.

**Sellers**
- What sellers can view.
- What products they can create, edit or delete.
- What inventory operations they can perform.
- What order-management capabilities are available.
- What delivery updates they can make.
- What financial and transaction information they can access.
- What account-management operations are supported.

**Administrators**
- What administrators can monitor.
- What records they can view.
- What management operations they can perform.
- What user-management permissions exist.
- What transaction and escrow operations they can perform.
- What dispute and refund operations are available.
- What system-level controls are implemented.

Do not assume that a role has a capability simply because it would be useful or expected in a typical e-commerce application.

A capability should only be documented as implemented when supported by actual application functionality and the relevant backend logic.

### 1.3 Distinguish implemented, partially implemented, simulated and planned features

Every major feature should be classified appropriately:

- **Implemented:** The functionality exists and works in the application.
- **Partially Implemented:** Some functionality exists, but the complete workflow is not yet available.
- **Simulated:** The application demonstrates the behaviour without performing the corresponding real-world operation.
- **Planned:** The functionality is intended but has not yet been implemented.
- **Not Implemented:** The functionality does not currently exist.

Do not confuse a visible frontend button with a fully implemented backend operation.

For example, a release-payment button does not prove that funds are actually transferred. Inspect the backend implementation and payment provider integration.

### 1.4 Resolve contradictions using evidence

When there is a disagreement between the prompt and the codebase:

1. Inspect the relevant frontend functionality.
2. Inspect the backend implementation.
3. Inspect database models and constraints.
4. Inspect the authentication and authorisation rules.
5. Inspect related services and integrations.
6. Determine the actual end-to-end behaviour.
7. Document the verified behaviour.

If the implementation is incomplete or contradictory, explicitly identify the uncertainty rather than guessing.

### 1.5 Maintain two separate perspectives

Throughout the documentation, distinguish between:

**A. Current System Documentation**

Describes what PlusBuy and TrustPay actually do today, based on the repository.

**B. Proposed System Design and Future Enhancements**

Describes intended functionality, architectural recommendations and improvements that have not yet been implemented.

Never combine these two perspectives in a way that makes proposed functionality appear to be operational.

---

# PART 2: UNDERSTANDING THE SYSTEMS

## 2.1 PlusBuy – E-commerce Application

PlusBuy is a single-seller e-commerce web application.

The business owner manages the store, uploads products, manages orders and receives payments.

Customers can browse products, purchase goods and make payments through TrustPay.

The seller manages products, inventory, orders and deliveries.

Administrators manage the areas of the application permitted by their assigned privileges.

**Important:** These descriptions provide business context only. Inspect the actual application to determine the exact features and capabilities available to each role.

## 2.2 TrustPay – Payment and Escrow Service

TrustPay is a separate payment service within the PlusBuy ecosystem.

Its intended purpose is to manage payment processing and conditional release of funds associated with purchases made through PlusBuy.

The proposed business scenario is:

1. The seller uploads a red shirt to PlusBuy.
2. John visits PlusBuy and orders the shirt.
3. John proceeds to checkout and selects TrustPay.
4. John chooses a Mobile Money payment method.
5. Available intended payment methods include MTN Mobile Money, Telecel Cash and AT Money.
6. John authorises the payment using his Mobile Money wallet.
7. TrustPay receives confirmation of the payment.
8. Funds are held under the agreed escrow or safeguarded funds arrangement.
9. The seller dispatches the product.
10. John receives the product and confirms receipt.
11. PlusBuy validates the order and customer confirmation.
12. PlusBuy instructs TrustPay to release the funds.
13. TrustPay processes the release and confirms the result.
14. The seller receives the funds, less applicable charges.

If John receives an incorrect product, he should be able to report a problem through the appropriate workflow, where implemented.

**Again, inspect the actual application and document its actual payment and escrow capabilities. Do not assume every operation in this scenario is already implemented.**

TrustPay should be documented as a separate logical payment service, with clearly defined responsibilities, interfaces, business rules and transaction states.

---

# PART 3: REPOSITORY INSPECTION

Before generating documentation, thoroughly inspect the existing project.

Examine:

1. Complete repository structure.
2. package.json and dependency versions.
3. Frontend application structure.
4. Backend implementation and API routes.
5. Components and reusable modules.
6. Authentication and authorisation implementation.
7. Prisma schema and database migrations.
8. Database relationships and constraints.
9. Payment-related implementation.
10. Escrow-related implementation.
11. TrustPay integration or service structure.
12. Environment variable usage.
13. Webhook implementations.
14. Existing tests.
15. Deployment and hosting configuration.

Do not expose secret values, API keys, database passwords, tokens or other credentials.

Do not assume a feature exists simply because it is described in the project requirements.

Do not invent implementation details.

Do not modify application functionality during this documentation exercise.

---

# PART 4: DOCUMENTATION STRUCTURE

Create the following structure inside the existing DOCUMENTATION folder.

DOCUMENTATION/

├── README.md

├── 01_PLUSBUY/

│   ├── 01_Project_Overview.md
│   ├── 02_Project_Background_and_Problem_Statement.md
│   ├── 03_Functional_Requirements.md
│   ├── 04_Non_Functional_Requirements.md
│   ├── 05_System_Architecture.md
│   ├── 06_Component_Architecture.md
│   ├── 07_Database_Design.md
│   ├── 08_API_Documentation.md
│   ├── 09_User_Roles_and_Permissions.md
│   ├── 10_User_Workflows.md
│   ├── 11_Security_Architecture.md
│   ├── 12_Deployment_and_Configuration.md
│   ├── 13_Testing_Strategy.md
│   └── 14_Future_Improvements.md

├── 02_TRUSTPAY/

│   ├── 01_Service_Overview.md
│   ├── 02_Business_Requirements.md
│   ├── 03_Functional_Requirements.md
│   ├── 04_Non_Functional_Requirements.md
│   ├── 05_Service_Architecture.md
│   ├── 06_Payment_Processing_Architecture.md
│   ├── 07_Escrow_Management_Architecture.md
│   ├── 08_Database_Design.md
│   ├── 09_API_Documentation.md
│   ├── 10_Payment_Lifecycle_and_State_Management.md
│   ├── 11_Webhooks_and_Event_Processing.md
│   ├── 12_Refunds_and_Dispute_Management.md
│   ├── 13_Security_and_Financial_Integrity.md
│   ├── 14_Reconciliation_and_Audit_Trail.md
│   ├── 15_Deployment_and_Configuration.md
│   ├── 16_Testing_Strategy.md
│   └── 17_Future_Improvements.md

└── 03_SYSTEM_DESIGN_AND_ARCHITECTURE/

    ├── 01_Overall_Ecosystem_Architecture.md
    ├── 02_Service_Communication_Architecture.md
    ├── 03_Data_Flow_Architecture.md
    ├── 04_Transaction_Sequence_Architecture.md
    ├── 05_Database_Relationship_Architecture.md
    ├── 06_Security_and_Trust_Boundaries.md
    ├── 07_Deployment_Architecture.md
    ├── 08_Architectural_Decisions.md
    └── diagrams/

        ├── overall_ecosystem_architecture.mmd
        ├── plusbuy_component_architecture.mmd
        ├── trustpay_component_architecture.mmd
        ├── service_communication.mmd
        ├── database_erd.mmd
        ├── payment_sequence.mmd
        ├── escrow_holding_and_release.mmd
        ├── dispute_resolution.mmd
        ├── customer_order_workflow.mmd
        ├── payment_state_machine.mmd
        ├── deployment_architecture.mmd
        └── security_trust_boundaries.mmd

You may add supporting files if necessary, but maintain this general structure and keep everything inside DOCUMENTATION.

---

# PART 5: PLUSBUY TECHNICAL PROJECT DOCUMENTATION

Generate comprehensive documentation for PlusBuy.

Include:

## 5.1 Project Overview

- Project introduction.
- Background.
- Problem statement.
- Proposed solution.
- Project aim.
- Specific objectives.
- Scope.
- System limitations.
- Target users.
- Expected benefits.

## 5.2 Functional Requirements

Document the actual functional requirements for customers, sellers and administrators.

Inspect and document all implemented functionality, including relevant areas such as:

- Registration and authentication.
- Product management.
- Product browsing.
- Search and filtering.
- Shopping cart.
- Checkout.
- Order creation.
- Payment initiation.
- Order tracking.
- Delivery updates.
- Receipt confirmation.
- Dispute reporting.
- Transaction history.
- Inventory management.
- Seller dashboard.
- Administrator dashboard.

Document actual behaviours and restrictions.

For example, inspect whether the cart supports multiple products, multiple quantities, product variants, stock validation and quantity updates.

Do not use the examples in this prompt as fixed system requirements.

Give each functional requirement a unique identifier, such as FR-001.

## 5.3 Non-Functional Requirements

Cover:

- Performance.
- Security.
- Availability.
- Reliability.
- Scalability.
- Maintainability.
- Usability.
- Data integrity.
- Accessibility.

Separate verified characteristics from recommended requirements.

## 5.4 Database Design

Document the actual PostgreSQL database structure.

Include:
- Tables and models.
- Field descriptions.
- Data types.
- Primary keys.
- Foreign keys.
- Relationships.
- Constraints.
- Indexes.
- Database transaction considerations.

Include a complete ER diagram.

## 5.5 API Documentation

Document actual API endpoints, including:
- Endpoint.
- HTTP method.
- Purpose.
- Authentication requirements.
- Request parameters.
- Request body.
- Response structure.
- Possible errors.

Use actual endpoints from the source code.

## 5.6 User Workflows

Explain the actual customer, seller and administrator workflows.

Use Mermaid flowcharts where appropriate.

---

# PART 6: TRUSTPAY TECHNICAL SERVICE DOCUMENTATION

Treat TrustPay as a separate payment service.

Document its actual and intended responsibilities separately.

Include:

## 6.1 Service Overview

- What TrustPay is.
- Why it exists.
- Its relationship with PlusBuy.
- Its role in the payment ecosystem.
- Its responsibilities.
- Its boundaries and limitations.

## 6.2 Payment Processing Architecture

Document the implemented payment process, including:

- Payment request creation.
- Payment reference generation.
- Payment method selection.
- Payment initiation.
- Customer authorisation.
- Payment confirmation.
- Server-side verification.
- Webhook processing.
- Payment status updates.
- Escrow holding confirmation.

Explain successful, failed, pending, cancelled and expired transactions where applicable.

## 6.3 Escrow Management Architecture

Explain:

- Escrow transaction creation.
- Payment and escrow references.
- Funds tracking.
- Escrow balances.
- Conditional release.
- Release validation.
- Payout processing.
- Failed payout handling.
- Duplicate release prevention.
- Dispute-related restrictions.
- Refund processing.

Include an escrow state-transition diagram.

Clearly distinguish actual implementation from proposed functionality.

## 6.4 Payment Lifecycle and State Management

Document relevant payment, escrow, order and payout states.

Explain valid transitions and the conditions required for each transition.

Do not introduce states into the description of the current implementation unless they exist in the code. Proposed states should be identified separately.

## 6.5 TrustPay API Documentation

Document actual payment service endpoints.

Where implemented, include:
- Payment initialisation.
- Payment verification.
- Payment status.
- Escrow creation.
- Escrow status.
- Escrow release.
- Payout status.
- Refund initiation.
- Webhook handling.
- Transaction history.

Label proposed endpoints clearly.

## 6.6 Webhooks and Event Processing

Explain:
- Webhook authentication.
- Signature verification.
- Duplicate event prevention.
- Idempotency.
- Event persistence.
- Retry handling.
- Out-of-order events.
- Failure recovery.

## 6.7 Financial Integrity and Security

Document:
- Secure payment references.
- Amount verification.
- Currency validation.
- Customer ownership validation.
- Release authorisation.
- Duplicate payout prevention.
- Secrets management.
- Audit logs.
- Transaction consistency.
- Reconciliation.

---

# PART 7: SYSTEM DESIGN AND ARCHITECTURE

Explain how PlusBuy and TrustPay work together.

Generate:

1. Overall ecosystem architecture.
2. Separate PlusBuy component architecture.
3. Separate TrustPay component architecture.
4. Service communication architecture.
5. Data flow architecture.
6. Payment transaction sequence architecture.
7. Escrow release sequence architecture.
8. Database relationship architecture.
9. Security and trust boundary architecture.
10. Deployment architecture.
11. Architectural decision records.

Generate Mermaid diagrams for the relevant processes.

All diagrams must reflect the actual implementation. Where an intended architecture differs from the current implementation, show and explain the difference.

---

# PART 8: IMPORTANT TECHNICAL AND FINANCIAL CONSIDERATIONS

## 8.1 Payment provider capabilities

The intended payment methods are MTN Mobile Money, Telecel Cash and AT Money.

Do not assume that a payment gateway supports all three.

Document provider capabilities only when confirmed by actual integration code or reliable provider documentation.

## 8.2 Escrow versus simulated escrow

Clearly distinguish:

- Simulated payment collection.
- Simulated fund holding.
- Simulated fund release.
- Actual Mobile Money collection.
- Actual escrow or safeguarded fund holding.
- Actual payout.

Never represent a simulated transaction as a real financial transaction.

## 8.3 Regulatory considerations

Explain that actual escrow operations involving customer funds require an appropriate arrangement with a licensed and authorised financial or payment service provider in Ghana.

Do not make unsupported claims that PlusBuy or TrustPay is independently authorised to hold customer funds.

## 8.4 Financial accuracy

Use Ghanaian Cedi (GHS) in financial examples.

Explain transaction amounts, fees, settlement amounts and refunds.

Avoid floating-point arithmetic for financial calculations.

---

# PART 9: DOCUMENTATION WRITING STANDARDS

The documentation must sound like it was written by an experienced software developer documenting a real application.

Use natural, professional and technically accurate language.

Avoid:
- Generic AI-style introductions.
- Repetitive explanations.
- Excessive buzzwords.
- Unnecessary filler.
- Overly complicated language.
- Unsupported claims.
- Repeating the same information unnecessarily.

Use consistent technical terminology.

Use tables where they improve readability.

Use Mermaid for architecture diagrams, sequence diagrams, flowcharts and database relationships.

The documents should be suitable for software developers, technical leads, software architects, project supervisors and future developers maintaining the application.

---

# PART 10: DOCUMENTATION INDEX

Create `DOCUMENTATION/README.md` as the central documentation index.

Include:

1. Introduction to the PlusBuy ecosystem.
2. Introduction to TrustPay.
3. Relationship between both systems.
4. Documentation navigation.
5. Architecture overview.
6. Current implementation status.
7. Important technical assumptions.
8. Known limitations.

Include relative links to all documents.

---

# PART 11: FINAL QUALITY ASSURANCE

After generating all documentation, perform a complete consistency review.

Verify:

1. All files are inside the existing DOCUMENTATION folder.
2. All referenced files exist.
3. Internal documentation links work.
4. API endpoints match the source code.
5. Database documentation matches the Prisma schema.
6. Architecture diagrams match the implementation.
7. TrustPay and PlusBuy responsibilities are clearly separated.
8. Payment, escrow, order and payout statuses are consistent.
9. Simulated and real payment operations are distinguished.
10. No credentials or sensitive environment values are exposed.
11. Mermaid diagrams are syntactically valid.
12. No major sections contradict each other.
13. Proposed features are clearly labelled.
14. All customer, seller and administrator capabilities reflect actual system behaviour.
15. All examples and descriptions have been checked against the actual implementation.
16. No assumptions from this prompt have been presented as facts when the source code contradicts them.

**Perform a specific final audit for discrepancies between this prompt and the repository. Correct the documentation wherever the repository shows different behaviour.**

Do not modify the application's business logic, frontend, backend, database schema or existing configuration during this task.

Only create or update documentation files inside `DOCUMENTATION`.

If you discover missing architectural information, document the gap instead of inventing an implementation.

---

# FINAL DELIVERABLE

Provide a concise report containing:

1. Complete documentation folder structure.
2. All generated documents.
3. All generated architecture diagrams.
4. Important architectural findings.
5. Actual customer capabilities.
6. Actual seller capabilities.
7. Actual administrator capabilities.
8. Features that are implemented.
9. Features that are simulated.
10. Features that are planned or missing.
11. Differences between the original project description and actual implementation.
12. Important security and financial integrity concerns.
13. Recommendations for the next development stage.

Begin by inspecting the repository and understanding the existing implementation.

Do not start writing documentation until you have completed the initial repository inspection.