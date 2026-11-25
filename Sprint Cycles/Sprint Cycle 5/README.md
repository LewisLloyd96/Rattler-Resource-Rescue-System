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

### Automated acceptance tests

`Testing/sprint5_api_test.py` runs every scenario above against the running API and the real MySQL database, and checks each change with a direct `SELECT`. Results of the last run are in `Testing/sprint5_api_test_output.txt`: **28 of 28 checks passed**.

| Use case | Valid case | Invalid / incomplete case | Database check |
|---|---|---|---|
| Administrator activates/deactivates an account | Deactivate, then reactivate | Missing justification; deactivating own account; Campus User refused (403) | `user.account_status` changes; both changes in `audit_log`; deactivated user cannot sign in |
| Campus User lists an item | Listing created (Pending Review) | Blank title and quantity 0; unknown category | New `item` row owned by the user; invalid attempts insert nothing |
| Department Representative creates/updates a listing | New listing; existing listing updated | Unknown condition; editing another department’s listing (404) | `item.owner_organization_id` is the department; quantity and location before → after |
| Student Org Representative creates a drive or giveaway | Collection drive created | End before start; missing location; Campus User refused (403) | New `collection_event` row for the organization |
| Community Moderator reviews a report | Report resolved with the action taken | Closing without describing the action; changing an already-closed report; Campus User refused (403) | `report.status` updated; `moderation_case.resolution` holds the action |
| Previously implemented functionality | Sprint IV acceptance tests re-run | | 32 of 32 still pass |

Run it from the repository root with the backend virtual environment active and the API running (it reads `backend/.env`). The tests write real data, so reload `01_schema.sql`, `02_sample_data.sql` and `05_demo_passwords.sql` before a demonstration.

```bash
python "Sprint Cycles/Sprint Cycle 5/Testing/sprint5_api_test.py"
```

Unit tests: `cd backend && python manage.py test` (10 tests) and `cd frontend && npm test` (19 tests).

## Technology Stack

- Frontend: React, TypeScript, and Tailwind CSS
- Backend: Python and Django REST Framework
- Database: MySQL
- API Communication: REST API
- Authentication: Database-backed authentication with signed tokens
- Version Control: Git and GitHub

## Demonstration Video

A recorded demonstration of Sprint Cycle V functionality is provided below.

**Video:** [`Video/Sprint-V-Demo.mp4`](Video/Sprint-V-Demo.mp4) (4 min 13 s, MP4). It is a screen recording of the application running from this repository; captions describe each step, and the dark terminal panels show live `mysql` query output before and after each change.

The demonstration includes:
1. Application startup and user authentication.
2. All five assigned use cases.
3. Database insertions and modifications.
4. Invalid-data validation.
5. Previously implemented functionality.

