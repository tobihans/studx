#!/usr/bin/env bash

action=$1

case "$action" in
  new)
    pactl load-module module-pipe-source \
      source_name=virtmic file=/tmp/virtmic \
      format=s16le rate=16000 channels=1
  ;;
  del)
    pactl unload-module module-pipe-source
  ;;
  *)
    echo 'Invalid option provided. new|del are the only options supported.'
  ;;
esac

