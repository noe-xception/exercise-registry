import datetime

# max four words

# parse date string
def parse_date(date_str):
    return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

# get historical max
def get_42_day_max(facts, exercise_sk, today_str):
    max_val = 0
    today_dt = parse_date(today_str)
    
    # calc window start
    start_dt = today_dt - datetime.timedelta(days=42)
    
    # iterate over facts
    for row in facts:
        # check exercise sk
        if row.get("exercise_sk") == exercise_sk:
            row_dt = parse_date(row.get("workout_dt"))
            
            # check date window
            if start_dt <= row_dt < today_dt:
                val = int(row.get("reps_cnt", 0))
                # update max value
                if val > max_val:
                    max_val = val
                    
    return max_val

# calculate streak counter
def calculate_streak(facts, today_str):
    daily_reps = {}
    today_dt = parse_date(today_str)
    
    # sum daily reps
    for row in facts:
        dt = parse_date(row.get("workout_dt"))
        reps = int(row.get("reps_cnt", 0))
        
        # skip future dates
        if dt > today_dt:
            continue
            
        # init daily sum
        if dt not in daily_reps:
            daily_reps[dt] = 0
            
        daily_reps[dt] += reps
        
    # filter active dates
    dates = []
    for dt, total in daily_reps.items():
        if total > 0:
            dates.append(dt)
            
    # sort dates ascending
    sorted_dates = sorted(dates)
    
    # check if empty
    if not sorted_dates:
        return 0
        
    # start from latest
    latest_dt = sorted_dates[-1]
    
    # check recent activity
    diff_days = (today_dt - latest_dt).days
    if diff_days > 2:
        return 0
        
    streak = 1
    # iterate backwards
    for i in range(len(sorted_dates) - 1, 0, -1):
        d1 = sorted_dates[i]
        d2 = sorted_dates[i - 1]
        
        # calculate gap days
        gap = (d1 - d2).days
        
        # check gap size
        if gap <= 2:
            streak += 1
        else:
            break
            
    return streak

# calculate daily efficiency
def calculate_efficiency(inputs, maxes, exercises):
    score = 0.0
    
    # iterate inputs
    for sk, reps in inputs.items():
        reps = float(reps)
        
        # find matching exercise
        exercise = next((e for e in exercises if e["exercise_sk"] == sk), None)
        if not exercise:
            continue
            
        weight = float(exercise.get("weight_num", 0))
        max_val = float(maxes.get(sk, 0))
        
        # apply formula safeguards
        if max_val == 0:
            if reps > 0:
                # new local max
                score += 1.0 * weight
        else:
            # calculate raw ratio
            ratio = reps / max_val
            
            # cap at one
            ratio = min(ratio, 1.0)
            
            # add weighted ratio
            score += ratio * weight
            
    # scale to percent
    return score * 100.0
