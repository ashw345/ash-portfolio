import AppKit
import AVFoundation

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: inspect-reference <video> <output-directory>\n", stderr)
    exit(2)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: videoURL)
let duration = CMTimeGetSeconds(asset.duration)
print(String(format: "duration=%.3f", duration))

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.02, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.02, preferredTimescale: 600)

let requestedTimes = CommandLine.arguments.dropFirst(3).compactMap(Double.init)
let times = requestedTimes.isEmpty
    ? [0.08, 0.24, 0.40, 0.56, 0.72, 0.88].map { duration * $0 }
    : requestedTimes
for (index, time) in times.enumerated() {
    let image = try generator.copyCGImage(
        at: CMTime(seconds: time, preferredTimescale: 600),
        actualTime: nil
    )
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else {
        fatalError("Unable to encode frame")
    }
    let name = String(format: "reference-%02d-%05.2f.jpg", index + 1, time)
    try data.write(to: outputDirectory.appendingPathComponent(name))
}
