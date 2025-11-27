# ProjectDashbored Frontend Flow Diagram

## User Navigation Flow

```mermaid
graph TD
    Start[User Visits Application] --> HomePage[HomePage Component]

    HomePage --> GetStarted{Click Get Started}
    GetStarted --> Dashboard[Navigate to Dashboard]

    HomePage --> LoginBtn{Click Login Button}
    LoginBtn --> LoginModal[LoginModal Opens]

    LoginModal --> SubmitLogin{Submit Credentials}
    SubmitLogin --> LoginSuccess[Set isLoggedIn = true]
    LoginSuccess --> Dashboard

    LoginModal --> SwitchToSignup{Click Switch to Signup}
    SwitchToSignup --> SignupModal[SignupModal Opens]

    SignupModal --> SubmitSignup{Submit Registration}
    SubmitSignup --> SignupSuccess[Set isLoggedIn = true]
    SignupSuccess --> Dashboard

    Dashboard --> LoggedInCheck{Is User Logged In?}

    LoggedInCheck -->|Yes| ShowTabs[Show Search & Profile Tabs]
    LoggedInCheck -->|No| ShowSearch[Show Only Search Tab]

    ShowTabs --> TabSelection{User Selects Tab}
    TabSelection -->|Search Tab| JobSearch[JobSearchDashboard]
    TabSelection -->|Profile Tab| Profile[ProfilePage]

    ShowSearch --> JobSearch

    JobSearch --> SearchForm[User Fills Search Form]
    SearchForm --> SubmitSearch{Click Search}
    SubmitSearch --> Loading[Show Loading Spinner]
    Loading --> Wait[1.5 Second Delay]
    Wait --> ShowResults[Display Mock Results Table]
    ShowResults --> Pagination[Pagination Controls]

    Profile --> EditMode{Toggle Edit Mode}
    EditMode -->|Edit| EditForm[Show Editable Form]
    EditMode -->|View| ViewProfile[Display Profile Data]

    EditForm --> SaveChanges{Click Save}
    SaveChanges --> UpdateProfile[Update Local State]
    UpdateProfile --> ViewProfile

    Dashboard --> LogoutBtn{Click Logout}
    LogoutBtn --> LogoutAction[Set isLoggedIn = false]
    LogoutAction --> HomePage

    style HomePage fill:#e1f5ff
    style Dashboard fill:#fff4e1
    style LoginModal fill:#ffe1f5
    style SignupModal fill:#ffe1f5
    style JobSearch fill:#e8ffe1
    style Profile fill:#f5e1ff
    style LoginSuccess fill:#90EE90
    style SignupSuccess fill:#90EE90
```

## Component State Flow

```mermaid
graph LR
    subgraph "App Component (Root)"
        AppState[App State]
        AppState --> currentPage[currentPage: home/dashboard]
        AppState --> activeTab[activeTab: search/profile]
        AppState --> isLoggedIn[isLoggedIn: boolean]
        AppState --> loginModalOpen[isLoginModalOpen: boolean]
        AppState --> signupModalOpen[isSignupModalOpen: boolean]
    end

    subgraph "HomePage Component"
        HomeProps[Props: onGetStarted]
        HomeState[No Local State]
    end

    subgraph "JobSearchDashboard Component"
        JobState[Local State]
        JobState --> jobTitle[jobTitle: string]
        JobState --> location[location: string]
        JobState --> distance[distance: number]
        JobState --> isLoading[isLoading: boolean]
        JobState --> showResults[showResults: boolean]
        JobState --> currentPage2[currentPage: number]
        JobState --> itemsPerPage[itemsPerPage: number]
        JobState --> mockData[mockData: array]
    end

    subgraph "ProfilePage Component"
        ProfileState[Local State]
        ProfileState --> isEditMode[isEditMode: boolean]
        ProfileState --> profile[profile: object]
        ProfileState --> editedProfile[editedProfile: object]
    end

    subgraph "LoginModal Component"
        LoginProps[Props]
        LoginProps --> isOpen1[isOpen: boolean]
        LoginProps --> onClose1[onClose: callback]
        LoginProps --> onLogin[onLogin: callback]
        LoginProps --> onSwitch1[onSwitchToSignup: callback]
        LoginState[Local State]
        LoginState --> email[email: string]
        LoginState --> password[password: string]
        LoginState --> rememberMe[rememberMe: boolean]
    end

    subgraph "SignupModal Component"
        SignupProps[Props]
        SignupProps --> isOpen2[isOpen: boolean]
        SignupProps --> onClose2[onClose: callback]
        SignupProps --> onSignup[onSignup: callback]
        SignupProps --> onSwitch2[onSwitchToLogin: callback]
        SignupState[Local State]
        SignupState --> name[name: string]
        SignupState --> email2[email: string]
        SignupState --> password2[password: string]
        SignupState --> confirmPass[confirmPassword: string]
    end

    AppState -->|Props| HomeProps
    AppState -->|Props| LoginProps
    AppState -->|Props| SignupProps

    HomeProps -->|Callback| AppState
    LoginProps -->|Callbacks| AppState
    SignupProps -->|Callbacks| AppState

    style AppState fill:#ffcccc
    style JobState fill:#ccffcc
    style ProfileState fill:#ccccff
    style LoginState fill:#ffccff
    style SignupState fill:#ffffcc
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant TB as Toolbar
    participant LM as LoginModal
    participant SM as SignupModal
    participant App as App Component
    participant DB as Dashboard

    Note over U,DB: Login Flow
    U->>TB: Click Login Button
    TB->>App: setIsLoginModalOpen(true)
    App->>LM: Render with isOpen=true
    U->>LM: Enter email & password
    U->>LM: Click Submit
    LM->>LM: console.log credentials
    LM->>App: onLogin() callback
    App->>App: setIsLoggedIn(true)
    App->>App: setCurrentPage("dashboard")
    App->>LM: onClose()
    App->>DB: Render Dashboard with tabs

    Note over U,DB: Signup Flow
    U->>TB: Click Login Button
    TB->>App: setIsLoginModalOpen(true)
    App->>LM: Render with isOpen=true
    U->>LM: Click "Switch to Signup"
    LM->>App: onSwitchToSignup()
    App->>App: setIsLoginModalOpen(false)
    App->>App: setIsSignupModalOpen(true)
    App->>SM: Render with isOpen=true
    U->>SM: Fill form & submit
    SM->>SM: Validate password match
    SM->>App: onSignup() callback
    App->>App: setIsLoggedIn(true)
    App->>App: setCurrentPage("dashboard")
    App->>SM: onClose()
    App->>DB: Render Dashboard with tabs

    Note over U,DB: Logout Flow
    U->>TB: Click Logout Button
    TB->>App: handleLogout()
    App->>App: setIsLoggedIn(false)
    App->>App: setCurrentPage("home")
    App->>App: setActiveTab("search")
    App->>HomePage: Render HomePage
```

## Job Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant JSD as JobSearchDashboard
    participant State as Component State
    participant Mock as Mock Data
    participant UI as User Interface

    U->>JSD: Enters search criteria
    U->>JSD: Selects distance (5-100 miles)
    U->>JSD: Click Search Button
    JSD->>State: setIsLoading(true)
    JSD->>State: setShowResults(false)
    JSD->>JSD: console.log(query, location, distance)

    Note over JSD,Mock: Simulated API Call
    JSD->>Mock: setTimeout(1500ms)
    Mock-->>JSD: Wait 1.5 seconds

    JSD->>State: setIsLoading(false)
    JSD->>State: setShowResults(true)
    JSD->>UI: Display mockData (23 items)

    Note over U,UI: Pagination Flow
    U->>JSD: Change items per page
    JSD->>State: setItemsPerPage(value)
    JSD->>State: setCurrentPage(1)
    JSD->>UI: Re-render table

    U->>JSD: Click Next Page
    JSD->>State: setCurrentPage(currentPage + 1)
    JSD->>UI: Display next page results

    U->>JSD: Click Specific Page Number
    JSD->>State: setCurrentPage(pageNumber)
    JSD->>UI: Display selected page results
```

## Profile Edit Flow

```mermaid
sequenceDiagram
    participant U as User
    participant PP as ProfilePage
    participant State as Component State
    participant UI as User Interface

    Note over U,UI: View Mode
    U->>PP: Navigate to Profile Tab
    PP->>State: Load profile data
    State->>UI: Display profile in view mode

    Note over U,UI: Edit Mode
    U->>PP: Click Edit Button
    PP->>State: setIsEditMode(true)
    PP->>State: Copy profile to editedProfile
    State->>UI: Show input fields & Save/Cancel buttons

    U->>PP: Modify profile fields
    PP->>State: Update editedProfile state

    alt User Saves Changes
        U->>PP: Click Save Button
        PP->>State: Copy editedProfile to profile
        PP->>State: setIsEditMode(false)
        State->>UI: Display updated profile in view mode
    else User Cancels Changes
        U->>PP: Click Cancel Button
        PP->>State: Discard editedProfile
        PP->>State: setIsEditMode(false)
        State->>UI: Display original profile in view mode
    end

    Note over PP,State: Top 8 Companies Edit
    U->>PP: Click Add Company (in edit mode)
    PP->>State: Append new company to editedProfile.companies
    State->>UI: Render new company input

    U->>PP: Click Remove Company
    PP->>State: Filter out company from array
    State->>UI: Update companies grid
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph "User Interaction Layer"
        User[User Actions]
    end

    subgraph "Presentation Layer"
        HomePage[HomePage]
        JobSearch[JobSearchDashboard]
        Profile[ProfilePage]
        LoginModal[LoginModal]
        SignupModal[SignupModal]
    end

    subgraph "State Management Layer"
        AppState[App State<br/>Navigation & Auth]
        JobState[JobSearch State<br/>Filters & Results]
        ProfileState[Profile State<br/>Edit Mode & Data]
        ModalState[Modal State<br/>Form Fields]
    end

    subgraph "Data Layer (Current)"
        MockData[Mock Data<br/>Hardcoded Arrays]
        LocalStorage[Browser Storage<br/>Not Implemented]
    end

    subgraph "Future Backend Integration"
        API[REST API<br/>Spring Boot Backend]
        Auth[JWT Authentication]
        Database[(PostgreSQL Database)]
    end

    User --> HomePage
    User --> JobSearch
    User --> Profile
    User --> LoginModal
    User --> SignupModal

    HomePage --> AppState
    JobSearch --> JobState
    Profile --> ProfileState
    LoginModal --> ModalState
    SignupModal --> ModalState

    LoginModal --> AppState
    SignupModal --> AppState

    JobState --> MockData
    ProfileState --> MockData

    AppState -.Future.-> Auth
    JobState -.Future.-> API
    ProfileState -.Future.-> API
    ModalState -.Future.-> Auth

    API -.-> Database
    Auth -.-> Database

    style User fill:#4CAF50
    style AppState fill:#2196F3
    style JobState fill:#FF9800
    style ProfileState fill:#9C27B0
    style ModalState fill:#E91E63
    style MockData fill:#607D8B
    style API fill:#00BCD4,stroke-dasharray: 5 5
    style Auth fill:#00BCD4,stroke-dasharray: 5 5
    style Database fill:#00BCD4,stroke-dasharray: 5 5
```

## Component Lifecycle and Rendering

```mermaid
graph TD
    Start[Application Start] --> RootRender[Render App Component]

    RootRender --> InitState[Initialize App State]
    InitState --> Toolbar[Render Toolbar]
    InitState --> MainContent[Render Main Content Area]

    MainContent --> PageCheck{currentPage?}

    PageCheck -->|home| RenderHome[Render HomePage]
    PageCheck -->|dashboard| RenderDashboard[Render Dashboard View]

    RenderDashboard --> AuthCheck{isLoggedIn?}

    AuthCheck -->|true| TabCheck{activeTab?}
    AuthCheck -->|false| ShowJobSearch[Render JobSearchDashboard]

    TabCheck -->|search| ShowJobSearch
    TabCheck -->|profile| ShowProfile[Render ProfilePage]

    Toolbar --> ModalCheck{Modal States}
    ModalCheck -->|loginModalOpen| ShowLogin[Render LoginModal]
    ModalCheck -->|signupModalOpen| ShowSignup[Render SignupModal]

    ShowJobSearch --> SearchMount[Component Mounts]
    SearchMount --> SearchInit[Initialize search state]
    SearchInit --> SearchRender[Render search form]
    SearchRender --> UserSearch{User submits search?}
    UserSearch -->|yes| LoadingState[Show loading spinner]
    LoadingState --> Delay[1.5s delay]
    Delay --> DisplayResults[Display results table]
    DisplayResults --> PaginationRender[Render pagination]

    ShowProfile --> ProfileMount[Component Mounts]
    ProfileMount --> ProfileInit[Initialize profile state]
    ProfileInit --> ViewMode[Render in view mode]
    ViewMode --> EditCheck{User clicks edit?}
    EditCheck -->|yes| EditMode[Switch to edit mode]
    EditMode --> SaveCheck{User saves?}
    SaveCheck -->|yes| UpdateState[Update profile state]
    SaveCheck -->|no| CancelEdit[Discard changes]
    UpdateState --> ViewMode
    CancelEdit --> ViewMode

    ShowLogin --> LoginMount[Component Mounts]
    LoginMount --> LoginForm[Render login form]
    LoginForm --> LoginSubmit{User submits?}
    LoginSubmit -->|valid| CloseLogin[Close modal & authenticate]
    LoginSubmit -->|switch| OpenSignup[Close & open signup]

    ShowSignup --> SignupMount[Component Mounts]
    SignupMount --> SignupForm[Render signup form]
    SignupForm --> SignupSubmit{User submits?}
    SignupSubmit -->|valid| CloseSignup[Close modal & authenticate]
    SignupSubmit -->|switch| OpenLogin[Close & open login]

    CloseLogin --> RenderDashboard
    CloseSignup --> RenderDashboard
    OpenSignup --> ShowSignup
    OpenLogin --> ShowLogin

    style Start fill:#4CAF50
    style RootRender fill:#2196F3
    style ShowJobSearch fill:#FF9800
    style ShowProfile fill:#9C27B0
    style ShowLogin fill:#E91E63
    style ShowSignup fill:#F44336
    style RenderHome fill:#00BCD4
```

## Future API Integration Architecture

```mermaid
graph TB
    subgraph "React Frontend (Current)"
        Components[React Components]
        State[Component State]
        Mock[Mock Data & Console Logs]
    end

    subgraph "Future HTTP Layer"
        Axios[Axios/Fetch Client]
        ReactQuery[React Query<br/>Caching & State]
        Interceptors[Request/Response<br/>Interceptors]
    end

    subgraph "Spring Boot Backend"
        Controller[JobSearchController]
        AuthController[AuthController]
        Service[JobSearchService]
        AuthService[AuthService]
    end

    subgraph "Data Persistence"
        PostgreSQL[(PostgreSQL<br/>Jobs & Users)]
        Redis[(Redis<br/>Cache)]
    end

    Components -->|Current| Mock
    Components -.Future.-> ReactQuery

    ReactQuery --> Axios
    Axios --> Interceptors

    Interceptors -->|GET /api/jobs/search| Controller
    Interceptors -->|POST /api/auth/login| AuthController
    Interceptors -->|POST /api/auth/signup| AuthController
    Interceptors -->|GET /api/user/profile| AuthController
    Interceptors -->|PUT /api/user/profile| AuthController

    Controller --> Service
    AuthController --> AuthService

    Service --> PostgreSQL
    Service --> Redis
    AuthService --> PostgreSQL

    AuthService -.JWT Token.-> Interceptors
    Interceptors -.Store Token.-> State

    style Components fill:#2196F3
    style Mock fill:#607D8B
    style ReactQuery fill:#FF9800,stroke-dasharray: 5 5
    style Axios fill:#FF9800,stroke-dasharray: 5 5
    style Interceptors fill:#FF9800,stroke-dasharray: 5 5
    style Controller fill:#4CAF50
    style AuthController fill:#4CAF50
    style PostgreSQL fill:#9C27B0
    style Redis fill:#E91E63
```

## Key Observations

### Current State (Mock Implementation)
1. **No Real API Calls**: All data is mocked with hardcoded arrays
2. **Console Logging**: Form submissions log to console instead of sending to backend
3. **Simulated Delays**: `setTimeout` used to mimic API latency
4. **Local State Only**: No persistence between page refreshes
5. **No Authentication**: Login/signup are visual only

### State Management Pattern
- **Unidirectional Data Flow**: Props down, callbacks up
- **Component-Level State**: Each component manages its own state
- **No Global State**: No Context API, Redux, or Zustand
- **Prop Drilling**: Limited to 2-3 levels (acceptable for current scale)

### Navigation Pattern
- **State-Based Routing**: Uses `currentPage` and `activeTab` state
- **No URL Routing**: Browser back button won't work
- **Modal Management**: Separate boolean states for each modal

### Future Integration Needs
1. **HTTP Client**: Axios or native Fetch
2. **State Management**: React Query for server state
3. **Router**: React Router for URL-based navigation
4. **Authentication**: JWT token storage and refresh
5. **Form Validation**: React Hook Form + Zod (already installed)
6. **Error Handling**: Error boundaries and toast notifications
