INSERT INTO stored_rest
	SELECT 2,restaurant_id, restaurant_name, category, address,holiday, opening_hours,break_time
    FROM restaurant
    WHERE restaurant_id = 2;



