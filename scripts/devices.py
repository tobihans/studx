import pygame
import pygame._sdl2.audio as sdl2_audio


def get_devices(capture_devices: bool = False) -> tuple[str, ...]:
    init_by_me = not pygame.mixer.get_init()
    if init_by_me:
        pygame.mixer.init()
    devices = tuple(sdl2_audio.get_audio_device_names(capture_devices))
    if init_by_me:
        pygame.mixer.quit()
    return devices


if __name__ == "__main__":
    __import__('pprint').pprint(get_devices())
