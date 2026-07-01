import http.server
import socketserver
import os
import json
import csv

PORT = 8080
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DATA_DIR = os.path.join(BASE_DIR, "data")

class WorkoutServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/api/data':
            # send dynamic data
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            data = self.get_workout_data()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            # serve static files
            super().do_GET()

    def get_workout_data(self):
        import datetime
        import calculator

        # read dim exercise
        exercises = {}
        dim_path = os.path.join(DATA_DIR, "dim_exercise.csv")
        if os.path.exists(dim_path):
            with open(dim_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    exercises[row["exercise_sk"]] = {
                        "name": row["exercise_nm"],
                        "unit": row.get("unit_nm", "reps"),
                        "weight": float(row.get("weight_num", 0))
                    }

        # read fct workout
        workouts = {}
        all_facts = []
        fct_path = os.path.join(DATA_DIR, "fct_workout.csv")
        if os.path.exists(fct_path):
            with open(fct_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    all_facts.append(row)
                    dt = row["workout_dt"]
                    sk = row["exercise_sk"]
                    reps = int(row.get("reps_cnt", 0))
                    score = float(row.get("daily_score_pct", 0.0))
                    duration_mins = int(row.get("duration_mins", 0))
                    
                    if dt not in workouts:
                        workouts[dt] = {
                            "daily_score": score,
                            "duration_mins": duration_mins,
                            "exercises": []
                        }
                    else:
                        workouts[dt]["duration_mins"] = max(workouts[dt].get("duration_mins", 0), duration_mins)
                    
                    # store exercise reps
                    ex_name = exercises.get(sk, {}).get("name", f"Exercise {sk}")
                    ex_unit = exercises.get(sk, {}).get("unit", "reps")
                    workouts[dt]["exercises"].append({
                        "exercise_sk": sk,
                        "name": ex_name,
                        "reps": reps,
                        "unit": ex_unit
                    })
        
        # calculate final stats
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # retrospectively recalculate efficiency for all past workouts based on current maxes
        # Use tomorrow's date to ensure today's workouts are included in the 42-day window
        tomorrow_dt = datetime.datetime.now() + datetime.timedelta(days=1)
        tomorrow_str = tomorrow_dt.strftime("%Y-%m-%d")
        
        current_maxes = {}
        for sk in exercises.keys():
            current_maxes[sk] = calculator.get_42_day_max(all_facts, sk, tomorrow_str)
            
        ex_list = [{"exercise_sk": sk, "weight_num": props["weight"]} for sk, props in exercises.items()]
        
        for dt, w_data in workouts.items():
            inputs = {ex["exercise_sk"]: ex["reps"] for ex in w_data["exercises"]}
            w_data["daily_score"] = calculator.calculate_efficiency(inputs, current_maxes, ex_list)
            
        streak = calculator.calculate_streak(all_facts, today_str)
        total_workouts = len(workouts)
        avg_intensity = 0.0
        total_duration = 0
        if total_workouts > 0:
            avg_intensity = sum(w["daily_score"] for w in workouts.values()) / total_workouts
            total_duration = sum(w.get("duration_mins", 0) for w in workouts.values())
        
        return {
            "exercises": exercises,
            "workouts": workouts,
            "stats": {
                "streak": streak,
                "total_workouts": total_workouts,
                "avg_intensity": avg_intensity,
                "total_duration": total_duration
            }
        }

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), WorkoutServerHandler) as httpd:
        print(f"Workout Visualization Server running at http://127.0.0.1:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    run()
