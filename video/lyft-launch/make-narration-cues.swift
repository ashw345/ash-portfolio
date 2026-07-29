import Foundation

struct Cue: Decodable {
    let scene: Int
    let english: String
    let chinese: String
}

let project = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let manifest = project.appendingPathComponent("narration-cues.json")
let output = project.appendingPathComponent("narration-cues", isDirectory: true)
let cues = try JSONDecoder().decode([Cue].self, from: Data(contentsOf: manifest))

try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

for (index, cue) in cues.enumerated() {
    let stem = String(format: "cue-%02d", index + 1)
    let textURL = output.appendingPathComponent("\(stem).txt")
    let audioURL = output.appendingPathComponent("\(stem).aiff")
    try cue.english.write(to: textURL, atomically: true, encoding: .utf8)

    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/say")
    task.arguments = [
        "-v", "Samantha",
        "-r", "190",
        "-f", textURL.path,
        "-o", audioURL.path
    ]
    try task.run()
    task.waitUntilExit()
    guard task.terminationStatus == 0 else {
        throw NSError(domain: "narration", code: Int(task.terminationStatus))
    }
    print("Generated \(stem) / scene \(cue.scene): \(cue.english)")
}
