# Exercise Registry

A command-line interface application for tracking sports workouts. The system stores data in local CSV files utilizing a Star Schema architecture (Dimension and Fact tables) to ensure data integrity and track historical metrics.

## Features

- **Idempotent Data Entry**: Overwrites duplicate records for the same business date.
- **Sliding Window Analytics**: Calculates efficiency scores based on a 42-day historical maximum.
- **Gamification**: Tracks consecutive workout streaks (maintains streak if rest period is <= 2 days).
- **Automated Backups**: Creates daily backups of the dataset before any modifications.

## Usage

1. Define your exercises in `dim_exercise.csv` (schema: `exercise_sk`, `exercise_nm`, `weight_num`, `sets_cnt`, `unit_nm`, `valid_from_dttm`, `valid_to_dttm`, `active_flg`).
2. Run the application:
   ```bash
   python main.py
   ```
3. Input the total repetitions for each prompted exercise.
