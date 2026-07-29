import AppKit
import AVFoundation

let directory = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let videoURL = directory.appendingPathComponent("lyft-street-view-demo.mp4")
let asset = AVURLAsset(url: videoURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.02, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.02, preferredTimescale: 600)

let sampleTimes = [1.5, 5.8, 8.5, 14.8, 21.8, 26.5, 29.7]

for time in sampleTimes {
    let image = try generator.copyCGImage(at: CMTime(seconds: time, preferredTimescale: 600), actualTime: nil)
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.88]) else {
        fatalError("Unable to encode frame at \(time)")
    }
    let name = String(format: "verify-%04.1f.jpg", time)
    try data.write(to: directory.appendingPathComponent(name))
}
