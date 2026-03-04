insert into interest_tags (name) values
('Oat Milk'),
('Caramel'),
('Vanilla'),
('Hazelnut'),
('Cold Brew'),
('Espresso'),
('Latte Art'),
('Plant-based'),
('Seasonal Specials'),
('Pastries')
on conflict (name) do nothing;

insert into customers (name, contact, favourite_product) values
  ('Raihaan', 'raihaan@email.com', 'Oat Milk Latte'),
  ('Sarah', 'sarah@email.com', 'Caramel Macchiato'),
  ('Mike', 'mike@email.com', 'Cold Brew'),
  ('Emma', 'emma@email.com', 'Vanilla Latte'),
  ('David', 'david@email.com', 'Espresso'),
  ('Lisa', 'lisa@email.com', 'Hazelnut Cappuccino'),
  ('James', 'james@email.com', 'Iced Oat Milk Latte'),
  ('Anna', 'anna@email.com', 'Caramel Cold Brew')
on conflict do nothing;

insert into customer_interests (customer_id, interest_tag_id)
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Raihaan' and t.name in ('Oat Milk', 'Plant-based', 'Latte Art')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Sarah' and t.name in ('Caramel', 'Vanilla', 'Pastries')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Mike' and t.name in ('Cold Brew', 'Espresso')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Emma' and t.name in ('Vanilla', 'Oat Milk', 'Seasonal Specials')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'David' and t.name in ('Espresso', 'Latte Art')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Lisa' and t.name in ('Hazelnut', 'Plant-based', 'Pastries')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'James' and t.name in ('Oat Milk', 'Cold Brew', 'Espresso')
union all
select c.id, t.id
from customers c
cross join interest_tags t
where c.name = 'Anna' and t.name in ('Caramel', 'Cold Brew', 'Seasonal Specials')
on conflict do nothing;

insert into campaigns (batch_id, theme, segment_description, why_now, message, time_window, generated_from_period)
values (
  gen_random_uuid(),
  'Oat Milk Lover''s Special',
  'Customers who enjoy oat milk-based drinks and plant-based options',
  'Plant-based milk alternatives are trending and customers love the creamy, sustainable option',
  'Hey oat milk fans! 🌱 We know you love the creamy goodness of oat milk in your coffee. Come enjoy our signature Oat Milk Latte with a warm, welcoming atmosphere that feels like home.',
  'Throughout this month',
  'all_time'
);
