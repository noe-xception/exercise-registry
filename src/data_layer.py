import csv
import os
import datetime

# file names
DIM_FILE = "dim_exercise.csv"
FCT_FILE = "fct_workout.csv"

# get active exercises
def get_active_exercises(directory="."):
    path = os.path.join(directory, DIM_FILE)
    exercises = []
    
    # check if missing
    if not os.path.exists(path):
        return exercises
        
    # open read mode
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # check active flag
            if row.get("active_flg") == "1":
                exercises.append(row)
                
    return exercises

# get all facts
def get_fct_workouts(directory="."):
    path = os.path.join(directory, FCT_FILE)
    facts = []
    
    # check if missing
    if not os.path.exists(path):
        return facts
        
    # open read mode
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            facts.append(row)
            
    return facts

# save facts idempotently
def save_workouts(new_rows, today_str=None, directory="."):
    path = os.path.join(directory, FCT_FILE)
    all_facts = []
    
    # set default date
    if today_str is None:
        now = datetime.datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        
    # check if exists
    if os.path.exists(path):
        # open read mode
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # keep old rows
                if row.get("workout_dt") != today_str:
                    all_facts.append(row)
                    
    # append new rows
    all_facts.extend(new_rows)
    
    # check if empty
    if not all_facts:
        return
        
    # get column names
    fieldnames = list(all_facts[0].keys())
    
    # open write mode
    with open(path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        # write file header
        writer.writeheader()
        
        # write all rows
        writer.writerows(all_facts)
