# Sprint Cycle V – Adding/Modifying Data

## Overview

Sprint Cycle V implements the application's data creation and modification workflows for all five user roles. These features extend the authentication, role-based navigation, and MySQL database functionality implemented during previous sprint cycles.

The application uses a React frontend, Django REST API, and MySQL database (`rattler_resource_rescue`). All Sprint V operations interact with the actual database through the backend API.

## Implemented Use Cases

| User Role | Functionality | Operation |
|---|---|---|
| Administrator | Activate or deactivate a user account | UPDATE |
| Campus User | Create a new item listing | INSERT |
| Department Representative | Create or update a department listing | INSERT / UPDATE |
| Student Organization Representative | Create a group giveaway or collection drive | INSERT |
| Community Moderator | Review a reported listing or exchange problem and record the action taken | UPDATE |

## Application Workflows

### 1. Administrator – Account Management
- Sign in using an Administrator account.
- Navigate to User Management.
- Search for an existing user.
- Activate or deactivate the selected account.
- Provide an administrative justification when required.
- Save the updated account status.

### 2. Campus User – Create Item Listing
- Sign in using a Campus User account.
- Navigate to the item marketplace or listing page.
- Create a new item listing.
- Enter the item name, description, condition, quantity, and pickup information.
- Submit the listing.
- Verify that the listing is saved and displayed in the application.

### 3. Department Representative – Department Listings
- Sign in using a Department Representative account.
- Navigate to Department Listings.
- Create a new department-owned listing or update an existing listing.
- Enter or modify the item information.
- Save the changes.
- Verify that the listing is associated with the appropriate department.

### 4. Student Organization Representative – Group Giveaways and Collection Drives
- Sign in using a Student Organization Representative account.
- Navigate to the organization events section.
- Create a new group giveaway or collection drive.
- Enter the event title, description, location, dates, and participation instructions.
- Submit the event.
- Verify that the event is saved and associated with the approved organization.

### 5. Community Moderator – Report Management
- Sign in using a Community Moderator account.
- Navigate to the moderation queue.
- Review a reported listing or exchange problem.
- Record the moderation decision and action taken.
- Update the report status.
- Verify that the moderation changes are saved in the database.

## Testing and Validation

The Sprint V implementation is tested using the following scenarios:

- **Valid data:** Submit valid information through each assigned workflow.
- **Invalid data:** Attempt to submit incomplete or invalid information and verify that appropriate validation messages appear.
- **Database verification:** Confirm that new records are inserted and existing records are updated in MySQL.
- **Role-based access:** Verify that users can access only the functionality authorized for their assigned roles.
- **Regression testing:** Confirm that authentication, role-specific dashboards, navigation, and previously implemented functionality continue to work.

## Technology Stack

- Frontend: React, TypeScript, and Tailwind CSS
- Backend: Python and Django REST Framework
- Database: MySQL
- API Communication: REST API
- Authentication: Database-backed authentication with signed tokens
- Version Control: Git and GitHub

## Demonstration Video

A recorded demonstration of Sprint Cycle V functionality is provided below.

**Video:** [Insert accessible video link here]

The demonstration includes:
1. Application startup and user authentication.
2. All five assigned use cases.
3. Database insertions and modifications.
4. Invalid-data validation.
5. Previously implemented functionality.

