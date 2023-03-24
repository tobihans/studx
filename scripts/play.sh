#!/usr/bin/env bash

INPUT_FILE=$1

function cleanup() {
  pactl unload-module module-null-sink
  pactl unload-module module-remap-source
}


# Resource: https://docs.audiorelay.net/instructions/linux/use-your-phone-as-a-mic-for-a-linux-pc

# Creates a device where AudioRelay can stream audio into
pactl load-module module-null-sink sink_name=audiorelay-virtual-mic-sink sink_properties=device.description=Virtual-Mic-Sink

# Creates a device usable by communications apps (e.g: skype)
pactl load-module module-remap-source master=audiorelay-virtual-mic-sink.monitor source_name=audiorelay-virtual-mic-sink source_properties=device.description=Virtual-Mic

trap cleanup EXIT

