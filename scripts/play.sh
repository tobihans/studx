#!/usr/bin/env bash

################################################################################
# Cleanup the virtual devices created
# Globals:
#     None
# Arguments:
#     $1: None
# Outputs:
#     None
# Returns:
#   exit code of pactl
################################################################################
function cleanup() {
  pactl unload-module module-remap-source
  pactl unload-module module-null-sink
}

################################################################################
# Creates a virtual microphone to play audio files through.
# Resource: https://docs.audiorelay.net/instructions/linux/use-your-phone-as-a-mic-for-a-linux-pc
# Globals:
#     None
# Arguments:
#     $1: The file to plat
# Outputs:
#     None
# Returns:
#     0 or non-0 exit code
################################################################################
function main() {
    INPUT_FILE=$1

    pactl load-module module-null-sink \
        sink_name=studx-virtual-mic-sink \
        sink_properties=device.description=StudX-Virtual-Microphone-Sink
    pactl load-module module-remap-source \
        master=studx-virtual-mic-sink.monitor \
        source_name=studx-virtual-mic-sink \
        source_properties=device.description=StudX-Virtual-Microphone

    if [[ ! -d .venv ]]
    then
        python -m venv .venv
        source .venv/bin/activate
        pip install -U pip setuptools wheel
        pip install pygame
    else
        source .venv/bin/activate
    fi

    python play.py "$INPUT_FILE"

    trap cleanup EXIT
}

main "$@"
