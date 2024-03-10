# Video Platform Backend

This project serves as the backend for a video uploading and viewing platform. The backend includes controllers for handling user-related functionalities, video management, likes, comments, tweets, subscriptions, dashboards, and playlists.

## Table of Contents

-   [Features](#features)

-   [Getting Started](#getting-started)

- [Prerequisites](#prerequisites)

- [Installation](#installation)

-   [Models](#models)

- [1. Users](#1-users)

- [2. Videos](#2-videos)

- [3. Likes](#3-likes)

- [4. Comments](#4-comments)

- [5. Tweets](#5-tweets)

- [6. Subscriptions](#6-subscriptions)

- [7. Dashboards](#7-dashboards)

- [8. Playlists](#8-playlists)

-   [License](#license)

## Features

-   User authentication and management

-   Video upload and viewing

-   Likes and comments on videos

-   Tweets related to video content

-   User subscriptions and dashboards

-   Playlist creation and management

## Getting Started

### Prerequisites

Before setting up the project, ensure you have the following installed:

-   Node.js

-   npm (Node Package Manager)

### Installation

1\. Clone the repository:

```bash

git clone https://github.com/ironjosh786/backend.git

Navigate to the project directory:cd backend

Install dependencies:npm install Create a .env file in the root directory and configure the following environment variables:

PORT,
CORS_ORIGIN,
MONGODB_URI,
ACCESS_TOKEN_SECRET,
ACCESS_TOKEN_EXPIRY,
REFRESH_TOKEN_SECRET,
REFRESH_TOKEN_EXPIRY,
CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET

Run the application:

npm start

Models

1\. Users

User model for authentication and profile management.

2\. Videos

Model to store information about uploaded videos.

3\. Likes

Model for tracking likes on videos.

4\. Comments

Model to store comments on videos.

5\. Tweets

Model for tweets related to video content.

6\. Subscriptions

Model to manage user subscriptions to channels.

7\. Dashboards

Model for user dashboards, aggregating content from subscribed channels.

8\. Playlists

Model for creating and managing user playlists.

License

This project is licensed under [ChaiAurCode](https://www.youtube.com/@chaiaurcode)
