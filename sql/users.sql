use sungmukdb;
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_image_url VARCHAR(255),
    user_role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    bio TEXT,
    favorite_stores TEXT,
    reviews_written INT DEFAULT 0,
    community_points INT DEFAULT 0,
    nickname VARCHAR(255),
    PRIMARY KEY (id)
);

