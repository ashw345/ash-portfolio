import AppKit
import AVFoundation

let directory = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let videoURL = directory.appendingPathComponent("lyft-street-view-full.mp4")
let asset = AVURLAsset(url: videoURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.02, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.02, preferredTimescale: 600)

let sampleTimes = [31.8, 35.4, 40.5, 48.8, 55.5, 63.5, 69.5, 74.5, 80.5, 87.2, 94.5]

for time in sampleTimes {
    let image = try generator.copyCGImage(at: CMTime(seconds: time, preferredTimescale: 600), actualTime: nil)
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.88]) else {
        fatalError("Unable to encode frame at \(time)")
    }
    let name = String(format: "full-verify-%04.1f.jpg", time)
    try data.write(to: directory.appendingPathComponent(name))
}
