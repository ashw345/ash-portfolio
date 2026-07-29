import AVFoundation
import Foundation

struct Cue: Decodable {
    let scene: Int
    let english: String
    let chinese: String
}

struct ScheduledCue {
    let scene: Int
    let start: Double
    let end: Double
}

let project = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let cues = try JSONDecoder().decode(
    [Cue].self,
    from: Data(contentsOf: project.appendingPathComponent("narration-cues.json"))
)

func duration(of index: Int) -> Double {
    let name = String(format: "cue-%02d.aiff", index + 1)
    let url = project.appendingPathComponent("narration-cues/\(name)")
    return CMTimeGetSeconds(AVURLAsset(url: url).duration)
}

let legacySceneEnds = [6.55, 13.65, 28.9, 37.7, 45.5, 52.7, 60.65, 66.05, 77.15, 85.35, 96.0]
var legacyCursor = 0.45
var legacyFailures: [String] = []

for scene in 0..<legacySceneEnds.count {
    for (index, cue) in cues.enumerated() where cue.scene == scene {
        legacyCursor += duration(of: index)
        if legacyCursor > legacySceneEnds[scene] {
            legacyFailures.append(
                "scene \(scene) cue \(index + 1) ends at \(String(format: "%.2f", legacyCursor))s, visual advances at \(String(format: "%.2f", legacySceneEnds[scene]))s"
            )
        }
        legacyCursor += 0.12
    }
}

if CommandLine.arguments.contains("--legacy") {
    guard !legacyFailures.isEmpty else {
        fputs("Legacy timeline unexpectedly passed.\n", stderr)
        exit(1)
    }
    print("Legacy timeline mismatch reproduced:")
    legacyFailures.forEach { print("- \($0)") }
    exit(2)
}

var cursor = 0.0
var scheduled: [ScheduledCue] = []
var sceneStarts: [Double] = []
for scene in 0..<legacySceneEnds.count {
    sceneStarts.append(cursor)
    cursor += scene == 0 ? 0.45 : 0.72
    for (index, cue) in cues.enumerated() where cue.scene == scene {
        let cueDuration = duration(of: index)
        scheduled.append(ScheduledCue(scene: scene, start: cursor, end: cursor + cueDuration))
        cursor += cueDuration + 0.12
    }
    cursor += 0.42
}

var failures: [String] = []
for scene in 0..<legacySceneEnds.count {
    let sceneCues = scheduled.filter { $0.scene == scene }
    guard let finalCue = sceneCues.last else { continue }
    let nextSceneStart = scheduled.first(where: { $0.scene == scene + 1 })?.start ?? (cursor + 1.0)
    if finalCue.end > nextSceneStart {
        failures.append("scene \(scene) narration overlaps scene \(scene + 1)")
    }
}

guard failures.isEmpty else {
    failures.forEach { fputs("SYNC ERROR: \($0)\n", stderr) }
    exit(1)
}

print("SYNC OK: \(scheduled.count) cues, no narration crosses a scene boundary.")
print("Scene starts: " + sceneStarts.map { String(format: "%.2f", $0) }.joined(separator: ", "))
print(String(format: "Total duration: %.2fs", cursor))
