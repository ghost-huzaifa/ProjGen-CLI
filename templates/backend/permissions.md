






- Roles
  - Doctor: App.CalenderView
  - Reception: App.CalenderView, App.Book
  - Accountant: App.ChangeInsStatus, App.ListView


- WorkFlows
  - Appointments
    - App.Book
    - App.CalenderView 
    - App.ChangeInsStatus
    - App.ListView


- @App.Book(): App.Create(1), App.Edit(1) 
  

  -----------Problem Definition --------------
- Say an app has 400 functions, Each function has a unique index
- Each workflow/permission needs a list of functions to perform workflow.
  - So workflow has a list of functions indices
- A role has list of permissions/Workflows 
- A user has multiple roles.
- 