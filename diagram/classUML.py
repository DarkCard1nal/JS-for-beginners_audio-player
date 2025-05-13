from plantuml import PlantUML

plantuml_code = """
@startuml

class AudioDevice {
  - _volume: number
  - _deviceName: string
  + setVolume(v: number): void
  + getVolume(): number
  + getName(): string
}

class MediaFile {
  + name: string
  + extension: string
  + size: number
  + duration: number
  + info(): string
}

class MemoryCard {
  + type: string
  + capacity: number
  - _connectedTo: AudioController
  - _files: MediaFile[]
  - _usedSpace: number
  + getUsedSpace(): number
  + getFiles(): MediaFile[]
  + getConnectedController(): AudioController
  + connect(controller: AudioController): boolean
  + disconnect(): void
  + addFile(file: MediaFile): void
}

class AudioDriver {
  - _channelVolumes: number[]
  - _connectedTo: AudioController
  - _totalChannels: number
  + setChannelVolume(channel: number, v: number): void
  + getChannelVolume(channel: number): number
  + connect(controller: AudioController): void
  + getConnectedController(): AudioController
  + info(): object
}

class AudioController {
  - _memoryCard: MemoryCard
  - _drivers: AudioDriver[]
  - _currentFileIndex: number
  - _currentTime: number
  - _isPlaying: boolean
  - _playTimeout
  - _autoPlay: boolean
  + setAutoPlay(value: boolean): void
  + getAutoPlay(): boolean
  + connectMemoryCard(card: MemoryCard): void
  + disconnectMemoryCard(): void
  + addDriver(driver: AudioDriver): void
  + playPause(): void
  + next(): void
  + prev(): void
  + info(): object
}

AudioDriver -|> AudioDevice
AudioController -|> AudioDevice
AudioController o-- "0..1" MemoryCard : has
MemoryCard --> "0..*" MediaFile : contains
AudioController --> "0..*" AudioDriver : controls
AudioDriver --> "0..1" AudioController : connectedTo
MemoryCard --> "0..1" AudioController : connectedTo

@enduml
"""

formats = {
    "svg": "http://www.plantuml.com/plantuml/svg/",
    "png": "http://www.plantuml.com/plantuml/png/"
}

for ext, url in formats.items():
	server = PlantUML(url=url)
	result = server.processes(plantuml_code)

	file_path = f"diagram/diagram_class_UML.{ext}"
	if ext == "svg":
		if isinstance(result, bytes):
			result = result.decode('utf-8')
		with open(file_path, "w", encoding="utf-8") as file:
			file.write(result)
	else:  # PNG
		if isinstance(result, bytes):
			with open(file_path, "wb") as file:
				file.write(result)
		else:
			print(f"Failed to generate {ext.upper()}")
