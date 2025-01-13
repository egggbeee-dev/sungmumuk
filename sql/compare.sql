CREATE TABLE compare (
    compare_id INT NOT NULL PRIMARY KEY,
    restaurant_id INT,
    restaurant_name VARCHAR(255),
    category VARCHAR(100),
    holiday VARCHAR(100),
    opening_hours VARCHAR(100),
    break_time VARCHAR(100),
    reservation_method VARCHAR(255),
    recommended_menu VARCHAR(255),
    solo_or_group VARCHAR(50),
    FOREIGN KEY(restaurant_id) REFERENCES restaurant(restaurant_id)
);

    
