# Exercise 2.1) Create large lists and python dictionaries,
# put them in object store. Write a Ray task to process them.
import logging
import random
import ray

"""
# 1. Local development
if ray.is_initialized():
    ray.shutdown()
ray.init(logging_level=logging.ERROR)
"""

"""
# 2. Inside Docker Cluster
ray.init(address='auto', logging_level=logging.ERROR)
"""

# 3. Local development with Docker Cluster
ray.init(address='ray://localhost:10001', logging_level=logging.ERROR)


def create_employees_dict(count):
    res = {}

    for i in range(count):
        days_employed = random.randint(1, 365)

        res[f'employee_{i}'] = {
            'name': f'employee_{i}',
            'age': random.randint(20, 40),
            'salary': random.randint(1000, 10000),
            'tracked_hours': [random.randint(1, 10) for _ in range(days_employed)]
        }

    return res


def create_departments_dict(count):
    res = {}

    for i in range(count):
        res[f'department_{i}'] = {
            'name': f'department_{i}',
            'location': f'location_{random.randint(0, 9)}',
        }

    return res


@ray.remote
def assign_employees_to_departments(employees, departments):
    employees_with_departments = employees.copy()

    for employee in employees.values():
        employee['department'] = random.choice(list(departments.keys()))

    return employees_with_departments


@ray.remote
def calc_average_salary(employees):
    total_salary = 0

    for employee in employees.values():
        total_salary += employee['salary']

    return total_salary / len(employees)


@ray.remote
def calc_average_salary_by_department_and_location(employees, departments):
    res = {}

    for employee in employees.values():
        department = employee['department']
        location = departments[department]['location']
        if location not in res:
            res[location] = {}
        if department not in res[location]:
            res[location][department] = []
        res[location][department].append(employee['salary'])

    return {k: {k2: sum(v2) / len(v2) for k2, v2 in v.items()} for k, v in res.items()}


@ray.remote
def calc_employee_cost_per_hour(employees):
    res = []

    for employee in employees.values():
        tracked_hours = employee['tracked_hours']
        total_hours = sum(tracked_hours)
        monthly_salary = employee['salary']
        monthly_hours = total_hours / len(tracked_hours) * 30
        res.append((employee['name'], monthly_salary / monthly_hours))

    return res


@ray.remote
def get_most_cost_effective_employee(cost_per_hour):
    return min(cost_per_hour, key=lambda x: x[1])


if __name__ == '__main__':
    print("Task 2 started")
    random.seed(42)

    employees = create_employees_dict(100_000)
    departments = create_departments_dict(100)

    employees_ref = ray.put(employees)
    departments_ref = ray.put(departments)

    employees_with_departments_ref = assign_employees_to_departments.remote(employees_ref, departments_ref)

    average_salary = ray.get(calc_average_salary.remote(employees_ref))
    print(f'Average salary: {average_salary}')

    average_salary_by_department_and_location = ray.get(
        calc_average_salary_by_department_and_location.remote(employees_with_departments_ref, departments_ref))
    for location, departments in sorted(average_salary_by_department_and_location.items()):
        print(f'Location: {location}')
        for department, salary in sorted(departments.items(), key=lambda x: x[1], reverse=True):
            print(f' Department: {department}, average salary: {salary:.2f}')

    cost_per_hour_ref = calc_employee_cost_per_hour.remote(employees_with_departments_ref)
    most_cost_effective_employee = ray.get(get_most_cost_effective_employee.remote(cost_per_hour_ref))

    print(
        f'Most cost effective employee: {most_cost_effective_employee[0]}, cost per hour: {most_cost_effective_employee[1]:.2f}')

    ray.shutdown()
