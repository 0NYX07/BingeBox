# BingeBox Backend Architecture

## 1. Overview

BingeBox is a full-stack video and social-content platform inspired by the core functionality of platforms such as YouTube.

The backend is responsible for:

* User registration, authentication, and account management
* User channels and profiles
* Long-form video uploads and playback metadata
* Short-form video content (Shorts)
* Community-style text/photo posts
* Comments and replies
* Likes and dislikes
* Channel subscriptions
* Playlists
* Notifications
* Media uploads and cloud storage
* Pagination, validation, authorization, and error handling

The backend should be built as a **modular monolith**.

A modular monolith means that the entire backend is one application, but its code is separated into clear feature modules. Each feature has its own routes, controllers, services, models, and validation where required.

This approach gives BingeBox a clean and scalable architecture without introducing the complexity of microservices too early.

---

# 2. Core Architectural Principle

The main request flow should follow this pattern:

```text
Client / Frontend
       |
       v
     Route
       |
       v
   Middleware
       |
       v
   Controller
       |
       v
    Service
       |
       v
     Model
       |
       v
    MongoDB
```

For media-heavy operations, a separate media layer is used:

```text
Client
  |
  v
Route
  |
  v
Controller
  |
  v
Video Service
  |
  +------> Media Service ------> Cloud Storage / Cloudinary
  |
  v
Database
```

Later, video processing can become asynchronous:

```text
User Upload
    |
    v
API
    |
    +----> Save upload/job information
    |
    v
Queue
    |
    v
Video Worker
    |
    +----> FFmpeg / Transcoding
    +----> Thumbnail generation
    +----> Metadata extraction
    |
    v
Storage / CDN
    |
    v
Video READY
```

---

# 3. Why Modular Monolith Instead of Microservices?

BingeBox is large enough to benefit from clear modules, but it does not need multiple independent backend services yet.

## Modular monolith

```text
BingeBox Backend
|
+-- Auth Module
+-- Users Module
+-- Videos Module
+-- Shorts Module
+-- Posts Module
+-- Comments Module
+-- Reactions Module
+-- Subscriptions Module
+-- Playlists Module
+-- Notifications Module
```

Everything runs inside one backend application.

## Why this is better for BingeBox right now

* Easier to develop
* Easier to debug
* Easier to deploy
* Easier to share authentication and database code
* Less network communication between services
* Less infrastructure to maintain
* Still gives strong separation between features

Microservices can be introduced later if BingeBox grows enough to justify them.

---

# 4. Recommended Backend Folder Structure

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   └── cors.js
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.validation.js
│   │   │   └── auth.constants.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── videos/
│   │   │   ├── video.model.js
│   │   │   ├── video.controller.js
│   │   │   ├── video.service.js
│   │   │   ├── video.routes.js
│   │   │   └── video.validation.js
│   │   │
│   │   ├── shorts/
│   │   │   ├── short.model.js
│   │   │   ├── short.controller.js
│   │   │   ├── short.service.js
│   │   │   └── short.routes.js
│   │   │
│   │   ├── posts/
│   │   │   ├── post.model.js
│   │   │   ├── post.controller.js
│   │   │   ├── post.service.js
│   │   │   └── post.routes.js
│   │   │
│   │   ├── comments/
│   │   │   ├── comment.model.js
│   │   │   ├── comment.controller.js
│   │   │   ├── comment.service.js
│   │   │   └── comment.routes.js
│   │   │
│   │   ├── reactions/
│   │   │   ├── reaction.model.js
│   │   │   ├── reaction.controller.js
│   │   │   ├── reaction.service.js
│   │   │   └── reaction.routes.js
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── subscription.model.js
│   │   │   ├── subscription.controller.js
│   │   │   ├── subscription.service.js
│   │   │   └── subscription.routes.js
│   │   │
│   │   ├── playlists/
│   │   │   ├── playlist.model.js
│   │   │   ├── playlist.controller.js
│   │   │   ├── playlist.service.js
│   │   │   └── playlist.routes.js
│   │   │
│   │   └── notifications/
│   │       ├── notification.model.js
│   │       ├── notification.controller.js
│   │       ├── notification.service.js
│   │       └── notification.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimit.middleware.js
│   │
│   ├── services/
│   │   ├── media.service.js
│   │   ├── email.service.js
│   │   └── notification.service.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── pagination.js
│   │
│   ├── app.js
│   └── index.js
│
├── public/
│   └── temp/
│
├── tests/
│
├── .env
├── package.json
└── package-lock.json
```

> `.env.example` is intentionally not included in this architecture.

---

# 5. `src/config/`

The `config` folder contains application configuration and external service setup.

## `env.js`

Responsible for loading and validating environment variables.

Examples:

```text
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
FRONTEND_URL
```

The rest of the application should not repeatedly read `process.env` everywhere. Configuration should be centralized here.

## `database.js`

Responsible for connecting BingeBox to MongoDB.

Conceptually:

```text
Application starts
       |
       v
Connect to MongoDB
       |
       +---- success ---> start server
       |
       +---- failure ---> stop / report error
```

## `cloudinary.js`

Contains Cloudinary configuration and initialization.

The rest of the application should use a media abstraction rather than configuring Cloudinary repeatedly inside controllers.

## `cors.js`

Keeps cross-origin configuration separate from the rest of the Express application setup.

---

# 6. `src/modules/`

This is the most important folder.

Each folder inside `modules/` represents one business feature of BingeBox.

The goal is:

```text
Everything related to videos -> videos/
Everything related to posts  -> posts/
Everything related to auth   -> auth/
```

This is better than putting every controller into one global `controllers/` folder as the application grows.

---

# 7. Authentication Module

```text
auth/
├── auth.controller.js
├── auth.service.js
├── auth.routes.js
├── auth.validation.js
└── auth.constants.js
```

Authentication is responsible for proving who a user is.

Typical operations:

* Register
* Login
* Logout
* Refresh token
* Password change
* Password reset, if added later

## Controller responsibility

The controller handles HTTP-related work.

Typical responsibilities:

* Read `req.body`
* Read cookies/tokens
* Call the service
* Choose the HTTP status
* Return the response

The controller should not contain a large amount of business logic.

## Service responsibility

The service performs the actual authentication work.

For registration:

```text
Input
  |
  v
Validate business rules
  |
  v
Check existing user
  |
  v
Hash password
  |
  v
Create user
  |
  v
Generate tokens
  |
  v
Return result
```

## Validation

`auth.validation.js` contains request schemas such as:

```text
registerSchema
loginSchema
changePasswordSchema
```

---

# 8. Users Module

```text
users/
├── user.model.js
├── user.controller.js
├── user.service.js
├── user.routes.js
└── user.validation.js
```

The Users module manages the user's account and public channel/profile information.

Possible operations:

* Get own profile
* Get another user's channel
* Update username
* Update description
* Update avatar
* Update cover image
* Update account information
* Delete/disable account

Authentication and user profile management remain separate because they represent different responsibilities.

```text
Authentication = Who are you?
Users          = What does your profile/channel look like?
```

---

# 9. Videos Module

```text
videos/
├── video.model.js
├── video.controller.js
├── video.service.js
├── video.routes.js
└── video.validation.js
```

This is one of the core BingeBox modules.

A video can contain information such as:

```text
Video
├── owner
├── title
├── description
├── videoUrl
├── thumbnailUrl
├── duration
├── views
├── category
├── visibility
├── status
└── timestamps
```

Possible status values:

```text
UPLOADING
PROCESSING
READY
FAILED
```

The `status` field becomes useful when video processing is added later.

## Typical video operations

* Upload video
* Get video by ID
* Get feed/list of videos
* Update title/description/thumbnail
* Delete video
* Increment views
* Search videos
* Get videos by channel
* Get recommended/related videos later

## Important design rule

The controller should not contain all upload, database, Cloudinary, validation, and business logic together.

A better flow is:

```text
video.routes.js
      |
      v
video.controller.js
      |
      v
video.service.js
      |
      +----> media.service.js
      |
      v
video.model.js
      |
      v
MongoDB
```

---

# 10. Shorts Module

BingeBox has a short-form video section similar to YouTube Shorts.

```text
shorts/
├── short.model.js
├── short.controller.js
├── short.service.js
└── short.routes.js
```

A Short can contain:

```text
Short
├── owner
├── videoUrl
├── thumbnailUrl
├── duration
├── views
└── timestamps
```

The Shorts module should be separate from long-form Videos because the behavior and presentation are different.

Examples of Shorts operations:

* Upload Short
* Get Shorts feed
* Get Short
* Delete Short
* Increment views
* Like/dislike Short
* Comment on Short
* Get Shorts by creator

---

# 11. Posts Module

BingeBox also has a social/community post section where users can upload text or photos.

```text
posts/
├── post.model.js
├── post.controller.js
├── post.service.js
└── post.routes.js
```

Possible post structure:

```text
Post
├── owner
├── text
├── imageUrl
├── visibility
└── timestamps
```

Possible operations:

* Create post
* Get feed
* Get post
* Edit post
* Delete post
* Like/dislike post
* Comment on post

Posts should remain independent from videos because their data and behavior are different.

---

# 12. Comments Module

Comments should be treated as their own domain.

```text
comments/
├── comment.model.js
├── comment.controller.js
├── comment.service.js
└── comment.routes.js
```

Possible comment structure:

```text
Comment
├── user
├── content
├── parent
├── target
├── targetType
├── likesCount
└── timestamps
```

The `parent` field can support replies.

Example:

```text
Comment
   |
   +-- Reply
   |     |
   |     +-- Reply
   |
   +-- Reply
```

The `target` and `targetType` approach can allow comments on different types of content:

```text
Video
Short
Post
```

---

# 13. Reactions Module

Likes and dislikes should have their own module.

```text
reactions/
├── reaction.model.js
├── reaction.controller.js
├── reaction.service.js
└── reaction.routes.js
```

A reaction can look conceptually like:

```js
{
    user: ObjectId("..."),
    target: ObjectId("..."),
    targetType: "Video",
    type: "like"
}
```

The same system could handle:

```text
Video
Short
Post
```

A unique constraint should prevent duplicate reactions from the same user on the same target.

Conceptually:

```text
user + target + targetType
```

should be unique.

This allows the backend to cleanly handle:

```text
Like
Dislike
Remove reaction
Change Like -> Dislike
Change Dislike -> Like
```

---

# 14. Subscriptions Module

Subscriptions should be represented using a dedicated collection rather than huge arrays inside the User document.

```text
subscriptions/
├── subscription.model.js
├── subscription.controller.js
├── subscription.service.js
└── subscription.routes.js
```

Conceptually:

```text
Subscription
├── subscriber
├── channel
└── timestamps
```

Example:

```text
User A subscribes to User B

subscriber = User A
channel    = User B
```

This makes it easier to handle:

* Subscribe
* Unsubscribe
* Subscriber count
* Subscribed channels
* Channel subscribers
* Checking whether the current user is subscribed

---

# 15. Playlists Module

Users may create playlists containing videos.

```text
playlists/
├── playlist.model.js
├── playlist.controller.js
├── playlist.service.js
└── playlist.routes.js
```

Conceptually:

```text
Playlist
├── owner
├── name
├── description
├── videos
├── visibility
└── timestamps
```

Possible operations:

* Create playlist
* Rename playlist
* Delete playlist
* Add video
* Remove video
* Reorder videos
* View playlist

Playlists belong primarily to users, while videos remain independent content.

---

# 16. Notifications Module

Notifications are useful for events such as:

```text
Someone subscribed to you
Someone liked your video
Someone commented on your video
Someone replied to your comment
Someone interacted with your post
```

The module:

```text
notifications/
├── notification.model.js
├── notification.controller.js
├── notification.service.js
└── notification.routes.js
```

Possible notification structure:

```js
{
    recipient,
    actor,
    type,
    entityId,
    entityType,
    isRead
}
```

Possible notification types:

```text
USER_SUBSCRIBED
VIDEO_LIKED
VIDEO_COMMENTED
COMMENT_REPLIED
POST_LIKED
```

The notification service can later be connected to real-time notifications.

---

# 17. Middleware

The middleware folder contains functionality that should run before or around route handlers.

```text
middlewares/
├── auth.middleware.js
├── upload.middleware.js
├── validate.middleware.js
├── error.middleware.js
└── rateLimit.middleware.js
```

## `auth.middleware.js`

Checks whether the user is authenticated.

Typical flow:

```text
Request
  |
  v
Read access token
  |
  v
Verify token
  |
  +---- invalid ---> 401 Unauthorized
  |
  +---- valid ----> attach user to req
```

Then:

```js
req.user
```

can be used by downstream code.

## `upload.middleware.js`

Handles multipart file uploads using Multer.

It should be responsible for things such as:

* Allowed file types
* File size limits
* Temporary file handling
* Upload field names

## `validate.middleware.js`

Runs validation schemas before the request reaches the controller.

## `error.middleware.js`

Centralized error handling.

Instead of every controller manually creating different error responses, the application should have one consistent error format.

## `rateLimit.middleware.js`

Protects sensitive or expensive endpoints from excessive requests.

Potential targets:

```text
Login
Register
Password reset
Comment creation
Reaction endpoints
Upload endpoints
```

---

# 18. Shared Services

Some functionality is used by several modules.

That functionality should not be duplicated.

```text
services/
├── media.service.js
├── email.service.js
└── notification.service.js
```

## `media.service.js`

Handles external media storage operations.

For example:

```text
upload image
upload video
delete image
delete video
generate / manage media references
```

The controller should not directly contain large amounts of Cloudinary logic.

Instead:

```js
await mediaService.uploadVideo(file);
```

This abstraction makes it easier to change the storage provider in the future.

Possible future providers:

```text
Cloudinary
AWS S3
Cloudflare R2
MinIO
```

## `email.service.js`

If BingeBox eventually needs email:

```text
Verification email
Password reset
Security alert
```

keep that functionality isolated here.

## `notification.service.js`

Responsible for creating notifications when events occur.

For example:

```text
User subscribes
      |
      v
subscription.service.js
      |
      v
notification.service.js
      |
      v
Notification model
```

---

# 19. Utilities

The `utils/` directory contains small reusable helpers.

```text
utils/
├── ApiError.js
├── ApiResponse.js
├── asyncHandler.js
└── pagination.js
```

## `ApiError.js`

Used for predictable application errors.

Example:

```js
throw new ApiError(404, "Video not found");
```

## `ApiResponse.js`

Provides a consistent response structure.

Example:

```json
{
  "success": true,
  "message": "Video fetched successfully",
  "data": {}
}
```

## `asyncHandler.js`

Keeps Express async route handlers clean and forwards errors to the centralized error handler.

## `pagination.js`

Contains reusable pagination logic for endpoints that return many documents.

---

# 20. `app.js`

`app.js` should create and configure Express.

It is responsible for things such as:

* Creating the Express application
* JSON parsing
* Cookie parsing
* CORS
* Logging
* Mounting routes
* Error middleware

Conceptually:

```text
Create Express app
      |
      +--> Global middleware
      |
      +--> API routes
      |
      +--> Error middleware
      |
      v
Export app
```

It should not be responsible for all database startup logic.

---

# 21. `index.js`

`index.js` should be the application entry point.

Conceptually:

```text
index.js
   |
   +--> Load configuration
   |
   +--> Connect MongoDB
   |
   +--> Start Express server
```

This creates a clean separation between:

```text
app.js   = Express application setup
index.js = application startup
```

---

# 22. Environment Variables

The `.env` file contains secrets and environment-specific configuration.

Example:

```text
PORT=8000

MONGODB_URI=...

JWT_SECRET=...
JWT_ACCESS_EXPIRES_IN=...
JWT_REFRESH_EXPIRES_IN=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

FRONTEND_URL=...
```

Never hard-code secrets inside source files.

Do not commit real credentials to GitHub.

---

# 23. `public/temp/`

The temporary directory can be used for local temporary file handling.

Example:

```text
User uploads video
       |
       v
Temporary file
       |
       v
Cloud storage
       |
       v
Temporary file deleted
```

The temporary directory should not become permanent video storage.

For large-scale video delivery, use proper object storage/CDN infrastructure.

---

# 24. Tests

The `tests/` directory contains automated tests.

Tests act like a robot checking whether the backend still works after code changes.

Example:

```text
tests/
├── auth/
│   ├── register.test.js
│   ├── login.test.js
│   └── logout.test.js
│
├── videos/
│   ├── upload.test.js
│   ├── getVideos.test.js
│   └── deleteVideo.test.js
│
├── comments/
│   └── comment.test.js
│
└── subscriptions/
    └── subscription.test.js
```

For example, a test can verify:

```text
Correct login details
        |
        v
Login should succeed
```

and:

```text
Wrong password
        |
        v
Login should fail
```

Tests are not required on day one, but they become increasingly valuable as BingeBox grows.

---

# 25. Controller vs Service vs Model

This is one of the most important concepts in the architecture.

## Route

Answers:

> Where should this request go?

Example:

```text
POST /api/v1/videos
```

## Controller

Answers:

> How do I handle this HTTP request?

It should:

* Read request data
* Call the service
* Send the response

Example:

```js
const createVideo = asyncHandler(async (req, res) => {
    const video = await videoService.createVideo(
        req.user,
        req.body,
        req.file
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "Video created successfully"
            )
        );
});
```

## Service

Answers:

> What should the application actually do?

It handles business logic.

Example:

```text
Check user permissions
Check uploaded file
Upload media
Create database document
Create related data
Return result
```

## Model

Answers:

> How is the data stored?

The Mongoose model defines:

```text
Fields
Types
Validation
Indexes
Relationships / references
```

---

# 26. Why Thin Controllers Matter

A bad controller can become:

```js
const uploadVideo = asyncHandler(async (req, res) => {

    // validate user

    // validate fields

    // validate file

    // check permissions

    // upload thumbnail

    // upload video

    // query database

    // calculate something

    // create video

    // send notification

    // delete temp file

    // generate response

});
```

This becomes difficult to maintain.

A cleaner controller is:

```js
const uploadVideo = asyncHandler(async (req, res) => {

    const video = await videoService.uploadVideo(
        req.user,
        req.body,
        req.file
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "Video uploaded successfully"
            )
        );
});
```

The complicated logic belongs in the service layer.

---

# 27. Database Architecture

The main MongoDB domains are:

```text
User
Video
Short
Post
Comment
Reaction
Subscription
Playlist
Notification
```

Conceptually:

```text
                         USER
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
      VIDEO             SHORT             POST
        |                 |                 |
        +-----------------+-----------------+
                          |
                          v
                       COMMENT
                          |
                          v
                       REACTION

USER ---- SUBSCRIPTION ---- USER

USER ---- PLAYLIST ---- VIDEO

USER ---- NOTIFICATION
```

MongoDB relationships should use references where appropriate rather than embedding massive arrays of related documents.

---

# 28. Video Schema Architecture

A video should contain enough metadata for BingeBox to manage it.

Conceptually:

```text
Video
├── owner
├── title
├── description
├── videoUrl
├── thumbnailUrl
├── duration
├── views
├── category
├── visibility
├── status
├── createdAt
└── updatedAt
```

Possible visibility values:

```text
PUBLIC
PRIVATE
UNLISTED
```

Possible processing states:

```text
UPLOADING
PROCESSING
READY
FAILED
```

This prepares the system for more advanced video-processing infrastructure.

---

# 29. Video Upload Architecture

A video upload should eventually follow this pattern:

```text
Frontend
   |
   | multipart/form-data
   v
Upload Middleware
   |
   v
Video Controller
   |
   v
Video Service
   |
   +------> Media Service
   |              |
   |              v
   |          Cloud Storage
   |
   v
Video Model
   |
   v
MongoDB
```

Later:

```text
Video upload
      |
      v
Processing queue
      |
      v
Worker
      |
      +--> FFmpeg
      +--> Transcoding
      +--> Thumbnail creation
      +--> Metadata extraction
      |
      v
Storage / CDN
      |
      v
Video READY
```

---

# 30. Video Processing States

A production-style video system should distinguish between:

```text
UPLOADING
PROCESSING
READY
FAILED
```

For example:

```text
Upload starts
    |
    v
UPLOADING
    |
    v
PROCESSING
    |
    +---- failure ---> FAILED
    |
    v
READY
```

This prevents the application from treating a partially processed video as a playable video.

---

# 31. Background Jobs

Video processing can become expensive.

Do not make the HTTP request wait for every expensive operation.

A later architecture could use:

```text
API
 |
 +--> Redis
       |
       v
    BullMQ
       |
       v
    Worker
       |
       +--> FFmpeg
       +--> thumbnails
       +--> metadata
```

The user can then receive:

```json
{
  "status": "PROCESSING"
}
```

instead of waiting for the entire video pipeline.

Do not add Redis and BullMQ immediately unless BingeBox actually needs background processing.

---

# 32. Reactions Architecture

Likes and dislikes can be handled using a reusable reaction system.

Example:

```text
User A
  |
  +--> LIKE --> Video 123
```

Database:

```js
{
    user: "userId",
    target: "videoId",
    targetType: "Video",
    type: "like"
}
```

For a Short:

```js
{
    user: "userId",
    target: "shortId",
    targetType: "Short",
    type: "like"
}
```

For a Post:

```js
{
    user: "userId",
    target: "postId",
    targetType: "Post",
    type: "like"
}
```

This avoids creating separate like systems for every content type.

---

# 33. Comment Architecture

Comments can use:

```text
Comment
├── user
├── target
├── targetType
├── content
├── parent
└── timestamps
```

Example:

```text
Comment on Video 123
        |
        +-- Reply
        |
        +-- Reply
```

The `parent` field identifies the comment being replied to.

The `targetType` can identify whether the comment belongs to:

```text
Video
Short
Post
```

---

# 34. Subscription Architecture

Instead of storing:

```js
subscribers: [ ... millions of IDs ... ]
```

inside a user document, use:

```text
Subscription
├── subscriber
├── channel
└── timestamps
```

This allows efficient queries such as:

```text
Who follows this channel?
What channels does this user follow?
Is this user subscribed?
How many subscribers does this channel have?
```

---

# 35. Notification Architecture

Notifications should be generated by business events.

Example:

```text
User subscribes to channel
        |
        v
Subscription Service
        |
        v
Notification Service
        |
        v
Create Notification
```

Likewise:

```text
Like video
   |
   v
Reaction Service
   |
   v
Notification Service
```

This keeps notifications out of unrelated controllers.

---

# 36. Search and Feed Architecture

As BingeBox grows, searching and feeds will become separate concerns.

For example:

```text
GET /api/v1/videos?search=javascript
```

The Videos service can initially use MongoDB queries and indexes.

Later, a dedicated search engine can be introduced if database search becomes insufficient.

Do not introduce a search engine too early.

---

# 37. Pagination

Endpoints returning many documents should be paginated.

Without pagination:

```text
GET /videos
```

could attempt to return thousands or millions of videos.

Instead:

```text
GET /videos?page=1&limit=20
```

Example response:

```json
{
  "success": true,
  "message": "Videos fetched successfully",
  "data": {
    "videos": []
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 248,
    "totalPages": 13,
    "hasNextPage": true
  }
}
```

For feeds that become large, cursor-based pagination can later replace or complement page-based pagination.

---

# 38. API Response Standardization

Try to maintain a consistent response format across the backend.

Successful response:

```json
{
  "success": true,
  "message": "Video fetched successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Video not found",
  "data": null
}
```

The exact shape can evolve, but consistency makes the frontend much easier to build.

---

# 39. Authentication vs Authorization

These are two different things.

## Authentication

> Who are you?

Example:

```text
JWT token
   |
   v
Identify user
```

## Authorization

> Are you allowed to do this?

Example:

```text
User A tries to delete User B's video
              |
              v
          Check owner
              |
              v
          DENY ACCESS
```

Both must exist in BingeBox.

---

# 40. Ownership Checks

Content operations should usually verify ownership.

Example:

```text
PATCH /videos/:videoId
DELETE /videos/:videoId
```

The service should verify:

```text
Does this video exist?
       |
       v
Who owns it?
       |
       v
Is current user the owner?
       |
   +---+---+
   |       |
  YES      NO
   |       |
 allow    deny
```

This prevents users from modifying other users' content.

---

# 41. Validation

Use a validation library such as Zod or another schema-validation solution.

Instead of repeating:

```js
if (!title) ...
if (!description) ...
if (!email) ...
```

create schemas.

Example concept:

```text
video.validation.js

createVideoSchema
updateVideoSchema
```

Then:

```text
Request
   |
   v
Validation Middleware
   |
   +---- invalid ---> return 400
   |
   v
Controller
```

Validation should exist at the API boundary before business logic runs.

---

# 42. Centralized Error Handling

All application errors should flow into one error-handling middleware.

Conceptually:

```text
Route
  |
  v
Controller
  |
  v
Service
  |
  +---- throw ApiError
            |
            v
      error.middleware.js
            |
            v
        JSON response
```

Example:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Video not found"
}
```

This makes backend behavior predictable for the frontend.

---

# 43. Security Considerations

BingeBox should eventually include:

* Password hashing with bcrypt
* JWT authentication
* Secure cookies where applicable
* Input validation
* Authorization/ownership checks
* File type validation
* File size limits
* Rate limiting
* CORS configuration
* Secure environment variables
* Proper error handling
* Protection against duplicate reactions/subscriptions
* Sanitization where needed

Security should be designed into the architecture instead of added as an afterthought.

---

# 44. Suggested Route Organization

```text
/api/v1/auth
    POST   /register
    POST   /login
    POST   /logout

/api/v1/users
    GET    /:username
    PATCH  /me
    PATCH  /me/avatar
    PATCH  /me/cover

/api/v1/videos
    POST   /
    GET    /
    GET    /:videoId
    PATCH  /:videoId
    DELETE /:videoId

/api/v1/shorts
    POST   /
    GET    /
    GET    /:shortId
    DELETE /:shortId

/api/v1/posts
    POST   /
    GET    /
    PATCH  /:postId
    DELETE /:postId

/api/v1/comments
    POST   /
    GET    /:targetType/:targetId
    PATCH  /:commentId
    DELETE /:commentId

/api/v1/reactions
    POST   /
    DELETE /:targetType/:targetId

/api/v1/subscriptions
    POST   /:channelId
    DELETE /:channelId
    GET    /subscriptions
    GET    /subscribers

/api/v1/playlists
    POST   /
    GET    /
    GET    /:playlistId
    PATCH  /:playlistId
    DELETE /:playlistId

/api/v1/notifications
    GET    /
    PATCH  /:notificationId/read
```

These are architectural examples, not mandatory final endpoints. They should be aligned with the actual frontend requirements as the project develops.

---

# 45. Example Request: Uploading a Video

A clean implementation should look conceptually like this:

```text
Frontend
   |
   | multipart/form-data
   v
POST /api/v1/videos
   |
   v
upload.middleware.js
   |
   v
video.controller.js
   |
   v
video.service.js
   |
   +------> media.service.js
   |              |
   |              v
   |          Cloudinary
   |
   v
video.model.js
   |
   v
MongoDB
```

The controller should not know every implementation detail of Cloudinary or MongoDB.

---

# 46. Example Request: Subscribe to a Channel

```text
User clicks Subscribe
        |
        v
POST /api/v1/subscriptions/:channelId
        |
        v
auth.middleware.js
        |
        v
subscription.controller.js
        |
        v
subscription.service.js
        |
        +--> Verify channel exists
        +--> Verify user is allowed
        +--> Prevent duplicate subscription
        +--> Create subscription
        +--> Create notification
        |
        v
subscription.model.js
        |
        v
MongoDB
```

This is much cleaner than putting all of these operations directly inside a route or controller function.

---

# 47. Example Request: Like a Video

```text
POST /api/v1/reactions
        |
        v
auth middleware
        |
        v
reaction controller
        |
        v
reaction service
        |
        +--> Check target exists
        +--> Check existing reaction
        +--> Create/update/remove reaction
        +--> Update counts if needed
        |
        v
MongoDB
```

If the same reaction system also supports Shorts and Posts, the architecture remains reusable.

---

# 48. Example Request: Comment on a Video

```text
POST /api/v1/comments
        |
        v
Auth middleware
        |
        v
Validation middleware
        |
        v
Comment controller
        |
        v
Comment service
        |
        +--> Verify video exists
        +--> Verify parent comment if replying
        +--> Create comment
        +--> Trigger notification
        |
        v
MongoDB
```

---

# 49. Refactoring Strategy for the Existing BingeBox Codebase

Do not rewrite the entire backend in one attempt.

Refactor in controlled stages.

## Stage 1 - Separate application startup

Create:

```text
app.js
index.js
```

Keep Express configuration in `app.js` and server/database startup in `index.js`.

## Stage 2 - Separate routes

Move endpoint definitions into route files.

```text
auth.routes.js
user.routes.js
video.routes.js
```

## Stage 3 - Thin controllers

Move business logic out of route files and controllers where necessary.

## Stage 4 - Create services

Move business rules into:

```text
*.service.js
```

## Stage 5 - Clean models

Keep Mongoose schemas focused on data structure, indexes, and model-level behavior.

## Stage 6 - Centralize middleware

Authentication, upload, validation, rate limiting, and errors should not be duplicated.

## Stage 7 - Centralize external integrations

Use `media.service.js` for Cloudinary/media operations.

## Stage 8 - Add tests

Once modules stabilize, add automated API/integration tests.

---

# 50. Important Refactoring Rule

Do not split files merely for the sake of having many files.

The goal is not:

```text
100 files = good architecture
```

The goal is:

```text
Each file has a clear responsibility.
```

For example:

```text
video.controller.js
=> HTTP handling

video.service.js
=> video business logic

video.model.js
=> MongoDB schema/data behavior

video.routes.js
=> endpoint definitions
```

That's clean without becoming file-management hell.

---

# 51. Things That Should NOT Be Added Too Early

Avoid introducing complex infrastructure just because it appears in large production systems.

Do not add all of these at the beginning:

```text
Microservices
Kafka
Kubernetes
Service Mesh
GraphQL
CQRS
Event Sourcing
Elasticsearch
Multiple databases
```

First make the modular monolith clean, stable, secure, and tested.

---

# 52. Future Architecture Evolution

BingeBox can evolve in stages.

## Version 1 - Clean modular monolith

```text
Express
Mongoose
MongoDB
JWT
Cloudinary
Validation
Tests
```

## Version 2 - Background processing

```text
Redis
BullMQ
Workers
FFmpeg
```

## Version 3 - Production media delivery

```text
Object Storage
HLS
CDN
Adaptive streaming
```

## Version 4 - Advanced platform features

```text
Search infrastructure
Recommendation systems
Analytics pipeline
Caching
Real-time notifications
```

The architecture should grow only when the application's requirements justify the additional infrastructure.

---

# 53. Final BingeBox Architecture

The target backend should conceptually look like this:

```text
                                   BINGEBOX BACKEND
                                           |
                   +-----------------------+-----------------------+
                   |                       |                       |
                   v                       v                       v
                ROUTES                 MIDDLEWARE              CONFIG
                   |                       |                       |
                   +-----------+-----------+                       |
                               |                                   |
                               v                                   |
                          CONTROLLERS                              |
                               |                                   |
                               v                                   |
                           SERVICES <------------------------------+
                               |
                 +-------------+--------------+
                 |             |              |
                 v             v              v
              MODELS      MEDIA SERVICE   NOTIFICATION
                 |             |              SERVICE
                 v             v              |
              MongoDB      Cloud Storage     |
                                             |
                                             v
                                        Notifications

Feature Modules:

    Auth
    Users
    Videos
    Shorts
    Posts
    Comments
    Reactions
    Subscriptions
    Playlists
    Notifications
```

---

# 54. Architecture Goals

The BingeBox backend should aim for the following properties:

## Separation of concerns

Each layer has one main responsibility.

## Maintainability

A change to one feature should require minimal changes elsewhere.

## Reusability

Shared operations such as media upload, notifications, validation, and pagination should not be duplicated.

## Security

Authentication, authorization, validation, file checking, rate limiting, and secret management should be treated as first-class concerns.

## Scalability

The architecture should be able to grow from a student project into a substantially larger application without requiring a complete rewrite.

## Simplicity

Do not add infrastructure before BingeBox actually needs it.

---

# 55. Recommended Priority Order

When implementing this architecture, use this order:

```text
1. app.js / index.js separation
2. Route separation
3. Authentication module
4. Users module
5. Video module
6. Shorts module
7. Posts module
8. Comments module
9. Reactions module
10. Subscriptions module
11. Playlists module
12. Notifications module
13. Shared media service
14. Validation middleware
15. Error middleware
16. Pagination conventions
17. Authorization/ownership checks
18. Automated tests
19. Background jobs
20. Video transcoding/HLS/CDN
```

This order keeps the refactor manageable and avoids introducing advanced infrastructure before the basic domain structure is stable.

---

# 56. Simple Mental Model

For remembering the architecture:

```text
ROUTES
"Where does the request go?"

CONTROLLERS
"Receive the request and send the response."

SERVICES
"What should the application actually do?"

MODELS
"How is the data stored?"

MIDDLEWARE
"What checks should happen before the request reaches the controller?"

CONFIG
"How does the application connect to external systems?"

UTILS
"What small helper code can be reused?"

TESTS
"Does the application still work after changes?"
```

This is the core mental model for the BingeBox backend.
