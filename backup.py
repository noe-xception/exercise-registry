import os
import shutil
import datetime

# max four words
def perform_backup(directory="."):
    # define backup folder
    backup_dir = os.path.join(directory, ".backup")
    
    # create if missing
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    # get current date
    now = datetime.datetime.now()
    date_str = now.strftime("%Y%m%d")
    
    # files to backup
    files = ["dim_exercise.csv", "fct_workout.csv"]
    
    # loop through files
    for file in files:
        source = os.path.join(directory, file)
        
        # check if exists
        if os.path.exists(source):
            name, ext = os.path.splitext(file)
            
            # create new name
            new_name = f"{name}_{date_str}{ext}"
            dest = os.path.join(backup_dir, new_name)
            
            # copy the file
            shutil.copy2(source, dest)
