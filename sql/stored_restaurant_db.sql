CREATE TABLE stored_rest (
    stored_rest_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    restaurant_name VARCHAR(100),
    category VARCHAR(50),
    address VARCHAR(255),
    holiday VARCHAR(50),
    opening_hour TIME,
    break_time TIME,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id)
);
