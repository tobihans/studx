"""
A simple program to play audio file through an input device (microphone)
"""

import sys
import time
from pygame import mixer

if sys.platform.startswith('linux'):
    mixer.init(devicename='StudX-Virtual-Microphone-Sink')
else:
    mixer.init(devicename='CABLE Input (VB-Audio Virtual Cable)')

try:
    filename = sys.argv[1]
except IndexError:
    print("Missing argument for file path")
    exit(15)

# Load audio file
mixer.music.load(filename)

print("Playing....\nCTRL-C to stop.")

# Set preferred volume
mixer.music.set_volume(0.5)

# Play the music
mixer.music.play(-1)

# Infinite loop
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Exiting...")
    mixer.quit()
