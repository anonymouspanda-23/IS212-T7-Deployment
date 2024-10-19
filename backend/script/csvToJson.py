import csv
import json


def convert_data_types(row):
    int_fields = ["staffId", "reportingManager", "role"]

    for field in int_fields:
        if field in row and row[field].isdigit():
            row[field] = int(row[field])
    return row


def csv_to_json(csv_file_path, json_file_path):
    data = []

    with open(csv_file_path, mode="r", encoding="utf-8") as csv_file:
        csv_reader = csv.DictReader(csv_file)

        for row in csv_reader:
            row = {
                "staffId": row.get("Staff_ID"),
                "staffFName": row.get("Staff_FName"),
                "staffLName": row.get("Staff_LName"),
                "dept": row.get("Dept"),
                "position": row.get("Position"),
                "country": row.get("Country"),
                "email": row.get("Email"),
                "reportingManager": row.get("Reporting_Manager"),
                "role": row.get("Role"),
            }
            row = convert_data_types(row)
            data.append(row)

    with open(json_file_path, mode="w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4)

    print(f"Converted {csv_file_path} to {json_file_path}")


csv_file_path = "employee.csv"
json_file_path = "employee.json"
csv_to_json(csv_file_path, json_file_path)
