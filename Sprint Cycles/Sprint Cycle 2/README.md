# Sprint Cycle II – Database Design

## Overview

Sprint Cycle II focuses on designing the database needed to support the complete application. The team will use the Functional Requirements document, system roles, use cases, and Sprint Cycle I User Interface Design to determine the data that must be stored and how that data should be organized.

Database implementation is not part of this sprint. The database will be implemented during Sprint Cycle III.

## Sprint Objectives

The objectives of Sprint Cycle II are to:

* Review the Functional Requirements and User Interface Design.
* Identify the data required to support the complete application.
* Identify the major entities and their attributes.
* Define primary keys and foreign keys.
* Establish relationships between entities.
* Define relationship cardinality.
* Resolve many-to-many relationships using associative entities when necessary.
* Create an Entity-Relationship Diagram.
* Create a Data Dictionary.
* Identify important database-related business rules.
* Review the database design for missing or unnecessary data.
* Organize all Sprint Cycle II materials in the team GitHub repository.

## Sprint Deliverables

The following materials are included in this sprint:

### 1. Entity-Relationship Diagram

The ERD represents the major entities required by the application and shows:

* Entities
* Attributes
* Primary keys
* Foreign keys
* Relationships
* Relationship cardinality

See the `ERD` folder for the completed diagram.

### 2. Data Dictionary

The Data Dictionary describes the fields included in the database design.

For each field, the Data Dictionary identifies:

* Entity
* Attribute/Field Name
* Description
* Data Type
* Key Type
* Required or Optional

See the `Data-Dictionary` folder for the complete Data Dictionary.

### 3. Business Rules

The Business Rules document identifies important rules that the application or database must enforce.

Examples include:

* Required information must be provided when necessary.
* Unique information cannot be duplicated.
* Records must maintain the appropriate relationships with other records.
* Users can only manage information permitted by their system role.

See the `Business-Rules` folder for the complete list of rules.

## Repository Structure

```text
Sprint-Cycle-II/
│
├── ERD/
│   └── Sprint-II-ERD.png
│
├── Data-Dictionary/
│   └── Data-Dictionary.md
│
├── Business-Rules/
│   └── Business-Rules.md
│
└── README.md
```

## Team Responsibilities

Sprint Cycle II work is divided among the four team members.

* **Naser:** Entity-Relationship Diagram
* **Ondrea:** Data Dictionary
* **Lloyd:** Data Dictionary
* **Isaiah:** Business Rules and Requirements Review

All team members will participate in reviewing the final database design before submission.

## Design Review

Before completing Sprint Cycle II, the team will review the design for:

* Missing entities
* Duplicate data
* Missing relationships
* Incorrect relationship cardinality
* Missing primary or foreign keys
* Attributes assigned to the wrong entity
* Data required by use cases that is not represented
* Unnecessary entities or attributes

The completed ERD and supporting documentation will serve as the starting point for Sprint Cycle III, where the database will be implemented.

## Sprint Cycle III

The database designed during this sprint will be used as the foundation for database implementation in Sprint Cycle III. If changes are required during implementation, the ERD and supporting documentation will be updated accordingly.

