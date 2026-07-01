import datetime
import backup
import data_layer
import calculator
import os

# main application entry
def main():
    # get data folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # perform auto backup
    backup.perform_backup(data_dir)
    
    # get active exercises
    exercises = data_layer.get_active_exercises(data_dir)
    
    # check if empty
    if not exercises:
        print("no active exercises found.")
        return
        
    # get current facts
    facts = data_layer.get_fct_workouts(data_dir)
    
    # get current date
    now = datetime.datetime.now()
    default_date = now.strftime("%Y-%m-%d")
    
    # ask user for workout date
    while True:
        date_input = input(f"\nworkout date [{default_date}]: ").strip()
        if not date_input:
            today_str = default_date
            break
        else:
            try:
                datetime.datetime.strptime(date_input, "%Y-%m-%d")
                today_str = date_input
                break
            except ValueError:
                print("  invalid format. please use YYYY-MM-DD (e.g. 2026-06-20)")
    
    # store user inputs
    inputs = {}
    maxes = {}
    
    print(f"\nenter reps for {today_str}:")
    
    # iterate active exercises
    for ex in exercises:
        sk = ex["exercise_sk"]
        nm = ex["exercise_nm"]
        unit = ex.get("unit_nm", "reps")
        
        # get default sets
        sets_str = ex.get("sets_cnt", "3")
        sets = int(sets_str) if sets_str.strip() else 3
        
        # get historical max
        max_val = calculator.get_42_day_max(facts, sk, today_str)
        maxes[sk] = max_val
        
        # prompt user input
        prompt = f"  {nm} [{sets} sets, {unit}] (max {max_val}): "
        val_str = input(prompt)
        
        # handle empty input
        if not val_str.strip():
            val = 0
        else:
            val = int(val_str)
            
        inputs[sk] = val
        
    # prompt for workout duration
    duration_str = input("\ntotal workout time (minutes): ")
    if not duration_str.strip():
        duration = 0
    else:
        duration = int(duration_str)
        
    # calculate daily efficiency
    score = calculator.calculate_efficiency(inputs, maxes, exercises)
    
    # prepare new facts
    new_rows = []
    for sk, reps in inputs.items():
        row = {
            "workout_dt": today_str,
            "exercise_sk": sk,
            "reps_cnt": str(reps),
            "daily_score_pct": f"{score:.2f}",
            "duration_mins": str(duration)
        }
        new_rows.append(row)
        
    # save facts idempotently
    data_layer.save_workouts(new_rows, today_str, data_dir)
    
    # reload facts
    all_facts = data_layer.get_fct_workouts(data_dir)
    
    # calculate streak counter
    streak = calculator.calculate_streak(all_facts, today_str)
    
    # print final stats
    print("\nworkout saved successfully.")
    print(f"daily score: {score:.2f}%")
    print(f"current streak: {streak} days")

if __name__ == "__main__":
    main()
