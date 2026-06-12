import datetime
import backup
import data_layer
import calculator

# main application entry
def main():
    # perform auto backup
    backup.perform_backup()
    
    # get active exercises
    exercises = data_layer.get_active_exercises()
    
    # check if empty
    if not exercises:
        print("no active exercises found.")
        return
        
    # get current facts
    facts = data_layer.get_fct_workouts()
    
    # get current date
    now = datetime.datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    
    # store user inputs
    inputs = {}
    maxes = {}
    
    print("enter reps for today:")
    
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
        
    # calculate daily efficiency
    score = calculator.calculate_efficiency(inputs, maxes, exercises)
    
    # prepare new facts
    new_rows = []
    for sk, reps in inputs.items():
        row = {
            "workout_dt": today_str,
            "exercise_sk": sk,
            "reps_cnt": str(reps),
            "daily_score_pct": f"{score:.2f}"
        }
        new_rows.append(row)
        
    # save facts idempotently
    data_layer.save_workouts(new_rows, today_str)
    
    # reload facts
    all_facts = data_layer.get_fct_workouts()
    
    # calculate streak counter
    streak = calculator.calculate_streak(all_facts, today_str)
    
    # print final stats
    print("\nworkout saved successfully.")
    print(f"daily score: {score:.2f}%")
    print(f"current streak: {streak} days")
    
if __name__ == "__main__":
    main()
