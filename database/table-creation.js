exports.createUserTable = `CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT auto_increment NOT NULL,
    user_name VARCHAR(512) NOT NULL,
    email VARCHAR(512) NOT NULL,
    password VARCHAR(512) NOT NULL,
    status VARCHAR(512) NOT NULL,
    server VARCHAR(512),
    ts BIGINT NOT NULL,
    PRIMARY KEY(user_id),
    UNIQUE(email),
    UNIQUE(user_name),
    INDEX(server)
)`;

