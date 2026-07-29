import AppKit
import AVFoundation
import CoreGraphics
import CoreText
import CoreVideo

let width = 1920
let height = 1080
let fps: Int32 = 30

let source = URL(fileURLWithPath: "/Users/aixuewang/Downloads/LyftPPT")
let outputDirectory = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let silentURL = outputDirectory.appendingPathComponent("lyft-full-silent.mp4")
let outputURL = outputDirectory.appendingPathComponent("lyft-street-view-full.mp4")
let musicURL = outputDirectory.appendingPathComponent("music-full.wav")
let cueDirectory = outputDirectory.appendingPathComponent("narration-cues", isDirectory: true)

struct CueSpec: Decodable {
    let scene: Int
    let english: String
    let chinese: String
}

struct TimedCue {
    let scene: Int
    let english: String
    let chinese: String
    let url: URL
    let start: Double
    let end: Double
}

let cueSpecs = try! JSONDecoder().decode(
    [CueSpec].self,
    from: Data(contentsOf: outputDirectory.appendingPathComponent("narration-cues.json"))
)

func audioDuration(_ url: URL) -> Double {
    return CMTimeGetSeconds(AVURLAsset(url: url).duration)
}

let legacySceneAnchors = [0.0, 6.55, 13.65, 28.9, 37.7, 45.5, 52.7, 60.65, 66.05, 77.15, 85.35, 96.0]
var realSceneAnchors: [Double] = []
var timedCues: [TimedCue] = []
var timelineCursor = 0.0

for scene in 0..<(legacySceneAnchors.count - 1) {
    realSceneAnchors.append(timelineCursor)
    var cueCursor = timelineCursor + (scene == 0 ? 0.45 : 0.72)
    for (index, cue) in cueSpecs.enumerated() where cue.scene == scene {
        let filename = String(format: "cue-%02d.aiff", index + 1)
        let url = cueDirectory.appendingPathComponent(filename)
        let cueEnd = cueCursor + audioDuration(url)
        timedCues.append(TimedCue(
            scene: scene,
            english: cue.english,
            chinese: cue.chinese,
            url: url,
            start: cueCursor,
            end: cueEnd
        ))
        cueCursor = cueEnd + 0.12
    }
    timelineCursor = cueCursor + 0.42
}

realSceneAnchors.append(timelineCursor)
let duration = timelineCursor
let frameCount = Int(ceil(duration * Double(fps)))

func legacyTime(for realTime: Double) -> Double {
    for index in 0..<(realSceneAnchors.count - 1) {
        let realStart = realSceneAnchors[index]
        let realEnd = realSceneAnchors[index + 1]
        if realTime <= realEnd || index == realSceneAnchors.count - 2 {
            let amount = clamp((realTime - realStart) / max(0.001, realEnd - realStart))
            return lerp(legacySceneAnchors[index], legacySceneAnchors[index + 1], amount)
        }
    }
    return legacySceneAnchors.last ?? 96.0
}

let lyftPink = CGColor(red: 1.0, green: 0.0, blue: 0.67, alpha: 1.0)
let ink = CGColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1.0)
let softWhite = CGColor(red: 0.97, green: 0.97, blue: 0.98, alpha: 1.0)
let paperWhite = CGColor(gray: 1.0, alpha: 1.0)

func clamp(_ value: Double, _ lower: Double = 0.0, _ upper: Double = 1.0) -> Double {
    return min(upper, max(lower, value))
}

func progress(_ time: Double, _ start: Double, _ end: Double) -> Double {
    return clamp((time - start) / (end - start))
}

func easeInOut(_ value: Double) -> Double {
    let t = clamp(value)
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0
}

func easeInOutQuint(_ value: Double) -> Double {
    let t = clamp(value)
    return t < 0.5 ? 16.0 * pow(t, 5.0) : 1.0 - pow(-2.0 * t + 2.0, 5.0) / 2.0
}

func easeOutQuint(_ value: Double) -> Double {
    return 1.0 - pow(1.0 - clamp(value), 5.0)
}

func easeOutBack(_ value: Double) -> Double {
    let t = clamp(value)
    let c1 = 1.22
    let c3 = c1 + 1.0
    return 1.0 + c3 * pow(t - 1.0, 3.0) + c1 * pow(t - 1.0, 2.0)
}

func easeOut(_ value: Double) -> Double {
    return 1.0 - pow(1.0 - clamp(value), 4.0)
}

func easeIn(_ value: Double) -> Double {
    return pow(clamp(value), 3.0)
}

func lerp(_ from: Double, _ to: Double, _ amount: Double) -> Double {
    return from + (to - from) * amount
}

func fadeWindow(_ time: Double, _ fadeInStart: Double, _ fullStart: Double, _ fullEnd: Double, _ fadeOutEnd: Double) -> Double {
    if time < fadeInStart || time > fadeOutEnd { return 0.0 }
    if time < fullStart { return easeOut(progress(time, fadeInStart, fullStart)) }
    if time <= fullEnd { return 1.0 }
    return 1.0 - easeIn(progress(time, fullEnd, fadeOutEnd))
}

func loadImage(_ path: String) -> CGImage {
    let url = source.appendingPathComponent(path)
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fatalError("Unable to load image: \(url.path)")
    }
    return cgImage
}

let logo = loadImage("1/image 6.png")
let streetView = loadImage("1/Street View.png")
let phone = loadImage("1/iPhone 14 - 87.png")
let ellipse = loadImage("1/Ellipse 304.png")
let coverFull = loadImage("1/1.png")
let aboutBackground = loadImage("3/5.png")
let aboutFull = loadImage("3/3.png")
let mapBackground = loadImage("4/Lyft-1.png")
let avatarStraight = loadImage("4/Group 60.png")
let avatarTilted = loadImage("5/Group 60.png")
let locationPin = loadImage("4/Location pin.png")
let cars = [
    loadImage("5/car_top 10.png"),
    loadImage("5/car_top 2.png"),
    loadImage("5/car_top 8.png"),
    loadImage("5/car_top 9.png")
]
let questionMarks = [
    loadImage("5/_.png"),
    loadImage("5/_-1.png"),
    loadImage("5/_-2.png"),
    loadImage("5/_-3.png")
]
let researchFull = loadImage("6/6.png")
let researchPosts = [
    loadImage("6/截屏2023-12-09 下午5.45 1.png"),
    loadImage("6/截屏2023-12-09 下午5.47 1.png"),
    loadImage("6/截屏2023-12-09 下午5.51 1.png")
]
let researchPieThirty = loadImage("6/Group 66.png")
let researchPieTen = loadImage("6/Group 67.png")
let researchPieSixty = loadImage("6/Group 68.png")
let researchLabelSixty = loadImage("6/Group 69.png")
let researchLabelTen = loadImage("6/Group 70.png")
let researchLabelThirty = loadImage("6/Group 71.png")
let personaFull = loadImage("7/7.png")
let problemFull = loadImage("8/8.png")
let insightFull = loadImage("9/9.png")
let questionFull = loadImage("10.png")
let journeyFull = loadImage("11&12/11.png")
let solutionJourneyFull = loadImage("11&12/12.png")
let journeyCurve = loadImage("11&12/Ellipse 293.png")
let journeyTitle = loadImage("11&12/User Experience Journey.png")
let locationSettingLabel = loadImage("11&12/Location Setting.png")
let waitingDriverLabel = loadImage("11&12/Waiting for the Driver.png")
let profileSettingLabel = loadImage("11&12/Profile Setting.png")
let vehicleSelectionLabel = loadImage("11&12/Vehicle Selection.png")
let driverMatchingLabel = loadImage("11&12/Driver Matching.png")
let rideExperienceLabel = loadImage("11&12/Ride Experience.png")
let paymentLabel = loadImage("11&12/Payment.png")
let solutionRevealFull = loadImage("13&14/13.png")
let solutionDetailFull = loadImage("13&14/14.png")
let solutionDescription = loadImage("13&14/Assist users in finding the pick-up point and driver more easily through Street View..png")

func removeIfPresent(_ url: URL) {
    if FileManager.default.fileExists(atPath: url.path) {
        try? FileManager.default.removeItem(at: url)
    }
}

func drawImage(
    _ image: CGImage,
    in context: CGContext,
    centerX: Double,
    centerY: Double,
    width drawWidth: Double,
    height drawHeight: Double,
    alpha: Double = 1.0,
    rotation: Double = 0.0,
    scale: Double = 1.0
) {
    guard alpha > 0.001 else { return }
    context.saveGState()
    context.setAlpha(CGFloat(alpha))
    context.translateBy(x: CGFloat(centerX), y: CGFloat(height) - CGFloat(centerY))
    context.rotate(by: CGFloat(rotation))
    context.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
    context.draw(
        image,
        in: CGRect(
            x: -CGFloat(drawWidth) / 2.0,
            y: -CGFloat(drawHeight) / 2.0,
            width: CGFloat(drawWidth),
            height: CGFloat(drawHeight)
        )
    )
    context.restoreGState()
}

func drawCover(
    _ image: CGImage,
    in context: CGContext,
    zoom: Double = 1.0,
    panX: Double = 0.0,
    panY: Double = 0.0,
    alpha: Double = 1.0
) {
    let imageWidth = Double(image.width)
    let imageHeight = Double(image.height)
    let baseScale = max(Double(width) / imageWidth, Double(height) / imageHeight)
    let drawWidth = imageWidth * baseScale * zoom
    let drawHeight = imageHeight * baseScale * zoom
    drawImage(
        image,
        in: context,
        centerX: Double(width) / 2.0 + panX,
        centerY: Double(height) / 2.0 + panY,
        width: drawWidth,
        height: drawHeight,
        alpha: alpha
    )
}

func fill(_ context: CGContext, color: CGColor, alpha: Double = 1.0) {
    context.saveGState()
    context.setFillColor(color.copy(alpha: CGFloat(alpha)) ?? color)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.restoreGState()
}

func drawRoundedRect(
    _ context: CGContext,
    x: Double,
    y: Double,
    width rectWidth: Double,
    height rectHeight: Double,
    radius: Double,
    color: CGColor,
    alpha: Double = 1.0
) {
    context.saveGState()
    context.setFillColor(color.copy(alpha: CGFloat(alpha)) ?? color)
    let rect = CGRect(
        x: CGFloat(x),
        y: CGFloat(height) - CGFloat(y + rectHeight),
        width: CGFloat(rectWidth),
        height: CGFloat(rectHeight)
    )
    context.addPath(CGPath(roundedRect: rect, cornerWidth: CGFloat(radius), cornerHeight: CGFloat(radius), transform: nil))
    context.fillPath()
    context.restoreGState()
}

func drawText(
    _ text: String,
    in context: CGContext,
    x: Double,
    y: Double,
    size: Double,
    color: CGColor,
    fontName: String = "PingFangSC-Semibold",
    tracking: Double = 0.0,
    alpha: Double = 1.0,
    centered: Bool = false
) {
    guard alpha > 0.001 else { return }
    let font = CTFontCreateWithName(fontName as CFString, CGFloat(size), nil)
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): color.copy(alpha: CGFloat(alpha)) ?? color,
        NSAttributedString.Key(kCTKernAttributeName as String): tracking
    ]
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: attributes))
    let bounds = CTLineGetBoundsWithOptions(line, [.useOpticalBounds])
    let ascent = CTFontGetAscent(font)
    let originX = centered ? CGFloat(x) - bounds.width / 2.0 : CGFloat(x)
    context.saveGState()
    context.textPosition = CGPoint(x: originX, y: CGFloat(height) - CGFloat(y) - ascent)
    CTLineDraw(line, context)
    context.restoreGState()
}

func drawLine(
    _ context: CGContext,
    from: CGPoint,
    to: CGPoint,
    color: CGColor,
    width lineWidth: Double,
    alpha: Double
) {
    context.saveGState()
    context.setStrokeColor(color.copy(alpha: CGFloat(alpha)) ?? color)
    context.setLineWidth(CGFloat(lineWidth))
    context.setLineCap(.round)
    context.move(to: CGPoint(x: from.x, y: CGFloat(height) - from.y))
    context.addLine(to: CGPoint(x: to.x, y: CGFloat(height) - to.y))
    context.strokePath()
    context.restoreGState()
}

func drawClippedImage(
    _ image: CGImage,
    in context: CGContext,
    clipX: Double,
    clipY: Double,
    clipWidth: Double,
    clipHeight: Double,
    centerX: Double,
    centerY: Double,
    drawWidth: Double,
    drawHeight: Double,
    alpha: Double
) {
    guard alpha > 0.001 else { return }
    context.saveGState()
    context.clip(to: CGRect(
        x: CGFloat(clipX),
        y: CGFloat(height) - CGFloat(clipY + clipHeight),
        width: CGFloat(clipWidth),
        height: CGFloat(clipHeight)
    ))
    drawImage(
        image,
        in: context,
        centerX: centerX,
        centerY: centerY,
        width: drawWidth,
        height: drawHeight,
        alpha: alpha
    )
    context.restoreGState()
}

func drawFocusedFullSlide(
    _ image: CGImage,
    in context: CGContext,
    zoom: Double,
    focusX: Double,
    focusY: Double,
    alpha: Double
) {
    let centerX = Double(width) / 2.0 - (focusX - Double(width) / 2.0) * (zoom - 1.0)
    let centerY = Double(height) / 2.0 - (focusY - Double(height) / 2.0) * (zoom - 1.0)
    drawImage(
        image,
        in: context,
        centerX: centerX,
        centerY: centerY,
        width: Double(width) * zoom,
        height: Double(height) * zoom,
        alpha: alpha
    )
}

func transformedMapPoint(_ point: CGPoint, zoom: Double, panX: Double, panY: Double) -> CGPoint {
    let centerX = Double(width) / 2.0
    let centerY = Double(height) / 2.0
    return CGPoint(
        x: centerX + (Double(point.x) - centerX) * zoom + panX,
        y: centerY + (Double(point.y) - centerY) * zoom + panY
    )
}

func drawOutlinedText(
    _ text: String,
    in context: CGContext,
    y: Double,
    size: Double,
    fillColor: CGColor,
    outlineColor: CGColor,
    fontName: String,
    alpha: Double
) {
    let radius = 2.4
    let offsets: [(Double, Double)] = [
        (-radius, 0), (radius, 0), (0, -radius), (0, radius),
        (-radius, -radius), (-radius, radius), (radius, -radius), (radius, radius)
    ]
    for offset in offsets {
        drawText(
            text,
            in: context,
            x: 960 + offset.0,
            y: y + offset.1,
            size: size,
            color: outlineColor,
            fontName: fontName,
            alpha: alpha,
            centered: true
        )
    }
    drawText(
        text,
        in: context,
        x: 960,
        y: y,
        size: size,
        color: fillColor,
        fontName: fontName,
        alpha: alpha,
        centered: true
    )
}

func drawSubtitle(
    _ text: String,
    in context: CGContext,
    y: Double,
    color: CGColor,
    alpha: Double
) {
    // Legacy calls stay silent. Audio and subtitles are now driven by one cue list.
}

func drawSynchronizedSubtitle(realTime: Double, in context: CGContext) {
    guard let cue = timedCues.first(where: {
        realTime >= $0.start - 0.08 && realTime <= $0.end + 0.16
    }) else { return }

    let fadeIn = easeOut(progress(realTime, cue.start - 0.08, cue.start + 0.12))
    let fadeOut = 1.0 - easeIn(progress(realTime, cue.end - 0.12, cue.end + 0.16))
    let isDarkScene = cue.scene == 1 || cue.scene == 2
    let fillColor = isDarkScene ? softWhite : ink
    let outlineColor = isDarkScene ? CGColor(gray: 0.0, alpha: 1.0) : paperWhite
    let englishY = cue.scene == 8 ? 760.0 : 912.0
    let chineseY = cue.scene == 8 ? 832.0 : 984.0
    let baseEnglishSize = cue.english.count > 76 ? 25.0 : (cue.english.count > 60 ? 27.0 : 30.0)
    let englishSize = baseEnglishSize * 1.8
    let subtitleAlpha = min(fadeIn, fadeOut)

    drawOutlinedText(
        cue.english,
        in: context,
        y: englishY,
        size: englishSize,
        fillColor: fillColor,
        outlineColor: outlineColor,
        fontName: "HelveticaNeue-Medium",
        alpha: subtitleAlpha
    )
    drawOutlinedText(
        cue.chinese,
        in: context,
        y: chineseY,
        size: 51,
        fillColor: fillColor,
        outlineColor: outlineColor,
        fontName: "PingFangSC-Semibold",
        alpha: subtitleAlpha
    )
}

func renderFrame(time realTime: Double, context: CGContext) {
    let time = legacyTime(for: realTime)
    fill(context, color: softWhite)

    // Scene 1: reveal the original composition in place, then push into the phone.
    let sceneOneAlpha = fadeWindow(time, 0.0, 0.18, 6.15, 6.95)
    if sceneOneAlpha > 0.0 {
        let phoneGroupIn = easeOutQuint(progress(time, 0.10, 2.15))
        let logoIn = easeOutQuint(progress(time, 0.45, 1.95))
        let titleIn = easeOutQuint(progress(time, 1.05, 2.55))

        if time < 5.15 {
            drawImage(
                ellipse,
                in: context,
                centerX: 1376 + lerp(125, 0, phoneGroupIn),
                centerY: 540 + lerp(55, 0, phoneGroupIn),
                width: 952,
                height: 952,
                alpha: sceneOneAlpha * phoneGroupIn
            )
            drawImage(
                phone,
                in: context,
                centerX: 1377 + lerp(125, 0, phoneGroupIn),
                centerY: 881 + lerp(55, 0, phoneGroupIn),
                width: 641,
                height: 1271,
                alpha: sceneOneAlpha * phoneGroupIn
            )
            drawImage(
                logo,
                in: context,
                centerX: 278 + lerp(-115, 0, logoIn),
                centerY: 486,
                width: 434,
                height: 306,
                alpha: sceneOneAlpha * logoIn
            )
            drawImage(
                streetView,
                in: context,
                centerX: 277.5,
                centerY: 749.5 + lerp(52, 0, titleIn),
                width: 373,
                height: 49,
                alpha: sceneOneAlpha * titleIn
            )
        } else {
            let phonePush = easeInOutQuint(progress(time, 5.15, 6.95))
            drawFocusedFullSlide(
                coverFull,
                in: context,
                zoom: lerp(1.0, 1.82, phonePush),
                focusX: 1468,
                focusY: 550,
                alpha: sceneOneAlpha
            )
            fill(context, color: lyftPink, alpha: sceneOneAlpha * easeIn(progress(time, 6.35, 6.95)) * 0.22)
        }

        let subtitleOne = fadeWindow(time, 0.45, 0.75, 3.25, 3.65)
        let subtitleTwo = fadeWindow(time, 3.55, 3.85, 5.75, 6.15)
        drawSubtitle("叫到车之后，上车似乎只剩最后一步。", in: context, y: 1000, color: ink, alpha: sceneOneAlpha * subtitleOne)
        drawSubtitle("但在复杂街区，真正的困难往往才刚开始。", in: context, y: 1000, color: ink, alpha: sceneOneAlpha * subtitleTwo)
    }

    // Scene 2: retain the original slide-three hierarchy and reveal it as one composition.
    let sceneTwoAlpha = fadeWindow(time, 6.55, 7.05, 13.65, 14.45)
    if sceneTwoAlpha > 0.0 {
        let sceneTwoSettle = easeOutQuint(progress(time, 6.55, 8.0))
        drawCover(
            aboutBackground,
            in: context,
            zoom: lerp(1.055, 1.0, sceneTwoSettle),
            panX: lerp(34, 0, sceneTwoSettle),
            alpha: sceneTwoAlpha
        )
        let textReveal = easeInOutQuint(progress(time, 6.95, 8.45))
        drawClippedImage(
            aboutFull,
            in: context,
            clipX: 180,
            clipY: 90,
            clipWidth: lerp(0, 1560, textReveal),
            clipHeight: 760,
            centerX: 960,
            centerY: 540,
            drawWidth: 1920,
            drawHeight: 1080,
            alpha: sceneTwoAlpha
        )
        let exactSettle = easeOutQuint(progress(time, 8.05, 8.75))
        drawImage(aboutFull, in: context, centerX: 960, centerY: 540, width: 1920, height: 1080, alpha: sceneTwoAlpha * exactSettle)

        let subtitleOne = fadeWindow(time, 7.0, 7.3, 10.15, 10.55)
        let subtitleTwo = fadeWindow(time, 10.45, 10.75, 13.65, 14.0)
        drawSubtitle("Lyft 是一家以网约车服务为核心的美国公司，", in: context, y: 1000, color: softWhite, alpha: sceneTwoAlpha * subtitleOne)
        drawSubtitle("连接乘客与司机，也必须解决上车前最后几米的识别问题。", in: context, y: 1000, color: softWhite, alpha: sceneTwoAlpha * subtitleTwo)
    }

    // Scene 3 and 4 share one continuous map world transform.
    let mapAlpha = fadeWindow(time, 13.65, 14.25, 29.0, 29.6)
    if mapAlpha > 0.0 {
        let mapArrival = easeOutQuint(progress(time, 13.65, 15.5))
        let mapMove = easeInOutQuint(progress(time, 20.7, 28.7))
        let arrivalZoom = lerp(1.14, 1.0, mapArrival)
        let mapZoom = arrivalZoom * lerp(1.0, 1.045, mapMove)
        let mapPanX = lerp(55, 0, mapArrival) + lerp(0, -14, mapMove)
        let mapPanY = lerp(-30, 0, mapArrival) + lerp(0, 9, mapMove)
        drawCover(
            mapBackground,
            in: context,
            zoom: mapZoom,
            panX: mapPanX,
            panY: mapPanY,
            alpha: mapAlpha
        )
        fill(context, color: ink, alpha: mapAlpha * lerp(0.0, 0.08, progress(time, 18.0, 22.0)))

        let pinIn = easeOutBack(progress(time, 14.65, 16.25))
        let pinTarget = transformedMapPoint(CGPoint(x: 959, y: 650), zoom: mapZoom, panX: mapPanX, panY: mapPanY)
        drawImage(
            locationPin,
            in: context,
            centerX: Double(pinTarget.x),
            centerY: lerp(770, Double(pinTarget.y), pinIn),
            width: 110 * mapZoom,
            height: 110 * mapZoom,
            alpha: mapAlpha * pinIn,
            scale: lerp(0.55, 1.0, pinIn)
        )

        let avatarIn = easeOutQuint(progress(time, 15.05, 16.7))
        let confusion = easeInOutQuint(progress(time, 20.7, 22.2))
        let straightTarget = transformedMapPoint(CGPoint(x: 957, y: 405), zoom: mapZoom, panX: mapPanX, panY: mapPanY)
        let tiltedTarget = transformedMapPoint(CGPoint(x: 952, y: 414.5), zoom: mapZoom, panX: mapPanX, panY: mapPanY)
        drawImage(
            avatarStraight,
            in: context,
            centerX: Double(straightTarget.x),
            centerY: lerp(470, Double(straightTarget.y), avatarIn),
            width: 342 * mapZoom,
            height: 342 * mapZoom,
            alpha: mapAlpha * avatarIn * (1.0 - confusion),
            scale: lerp(0.80, 1.0, avatarIn)
        )
        drawImage(
            avatarTilted,
            in: context,
            centerX: Double(tiltedTarget.x),
            centerY: Double(tiltedTarget.y),
            width: 360 * mapZoom,
            height: 361 * mapZoom,
            alpha: mapAlpha * confusion,
            rotation: 0.0
        )

        let carTargets: [(CGPoint, CGPoint, Double, Double)] = [
            (CGPoint(x: 1594, y: 802), CGPoint(x: 2180, y: 880), 247, 151),
            (CGPoint(x: 1165, y: 728), CGPoint(x: 1090, y: 1220), 286, 216),
            (CGPoint(x: 603, y: 566), CGPoint(x: -280, y: 610), 270, 203),
            (CGPoint(x: 1292, y: 445), CGPoint(x: 1325, y: -340), 203, 270)
        ]
        let questionTargets = [
            CGPoint(x: 1531, y: 668),
            CGPoint(x: 1128, y: 832),
            CGPoint(x: 581, y: 667),
            CGPoint(x: 1389, y: 389)
        ]

        for index in 0..<cars.count {
            let start = 21.0 + Double(index) * 0.58
            let carIn = easeInOutQuint(progress(time, start, start + 2.05))
            let target = carTargets[index]
            let transformedTarget = transformedMapPoint(target.0, zoom: mapZoom, panX: mapPanX, panY: mapPanY)
            let x = lerp(Double(target.1.x), Double(transformedTarget.x), carIn)
            let y = lerp(Double(target.1.y), Double(transformedTarget.y), carIn) - sin(carIn * .pi) * 34.0
            drawImage(
                cars[index],
                in: context,
                centerX: x,
                centerY: y,
                width: target.2 * mapZoom,
                height: target.3 * mapZoom,
                alpha: mapAlpha * carIn,
                rotation: 0.0,
                scale: lerp(0.86, 1.0, carIn)
            )

            let questionIn = easeOutBack(progress(time, start + 1.40, start + 2.35))
            let questionTarget = transformedMapPoint(questionTargets[index], zoom: mapZoom, panX: mapPanX, panY: mapPanY)
            drawImage(
                questionMarks[index],
                in: context,
                centerX: Double(questionTarget.x),
                centerY: Double(questionTarget.y),
                width: 70 * mapZoom,
                height: 97 * mapZoom,
                alpha: mapAlpha * questionIn,
                scale: lerp(0.40, 1.0, questionIn)
            )
        }

        let mapSubtitleOne = fadeWindow(time, 14.25, 14.6, 20.35, 20.75)
        let mapSubtitleTwo = fadeWindow(time, 20.8, 21.15, 25.05, 25.45)
        let mapSubtitleThree = fadeWindow(time, 25.35, 25.7, 28.85, 29.2)
        drawSubtitle("地图能告诉 Sophia 所在的位置，却不能告诉她应该看向哪里。", in: context, y: 1000, color: softWhite, alpha: mapAlpha * mapSubtitleOne)
        drawSubtitle("当周围同时出现多辆相似车辆，定位与街区信息反而增加判断负担。", in: context, y: 1000, color: softWhite, alpha: mapAlpha * mapSubtitleTwo)
        drawSubtitle("她需要的不是更多标记，而是一眼确认真实环境。", in: context, y: 1000, color: softWhite, alpha: mapAlpha * mapSubtitleThree)
    }

    // Scene 5: research evidence arrives as separate observations, then resolves
    // into the original slide composition.
    let researchAlpha = fadeWindow(time, 28.9, 29.45, 37.7, 38.45)
    if researchAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: researchAlpha)

        let headerIn = easeOutQuint(progress(time, 29.0, 29.75))
        drawClippedImage(
            researchFull,
            in: context,
            clipX: 0,
            clipY: 0,
            clipWidth: 1920,
            clipHeight: 145,
            centerX: 960,
            centerY: 540 + lerp(-18, 0, headerIn),
            drawWidth: 1920,
            drawHeight: 1080,
            alpha: researchAlpha * headerIn
        )

        let postLayouts: [(CGImage, Double, Double, Double, Double, Double)] = [
            (researchPosts[2], 514, 300.5, 908, 165, 29.25),
            (researchPosts[1], 514, 543.5, 908, 171, 30.25),
            (researchPosts[0], 514, 774, 908, 176, 31.25)
        ]
        for item in postLayouts {
            let itemIn = easeOutQuint(progress(time, item.5, item.5 + 1.25))
            drawImage(
                item.0,
                in: context,
                centerX: item.1 + lerp(-120, 0, itemIn),
                centerY: item.2,
                width: item.3,
                height: item.4,
                alpha: researchAlpha * itemIn,
                scale: lerp(0.98, 1.0, itemIn)
            )
        }

        let pieCenterX = 1349.0
        let pieCenterY = 580.5

        let tenIn = easeOutBack(progress(time, 32.50, 32.88))
        drawImage(
            researchPieTen,
            in: context,
            centerX: pieCenterX,
            centerY: pieCenterY,
            width: 483,
            height: 483,
            alpha: researchAlpha * tenIn,
            scale: lerp(0.76, 1.0, tenIn)
        )
        let tenLabelIn = easeOutQuint(progress(time, 32.58, 32.95))
        drawImage(
            researchLabelTen,
            in: context,
            centerX: 1700.5 + lerp(48, 0, tenLabelIn),
            centerY: 456,
            width: 279,
            height: 130,
            alpha: researchAlpha * tenLabelIn
        )

        let thirtyIn = easeOutBack(progress(time, 32.95, 33.45))
        drawImage(
            researchPieThirty,
            in: context,
            centerX: pieCenterX,
            centerY: pieCenterY,
            width: 483,
            height: 483,
            alpha: researchAlpha * thirtyIn,
            scale: lerp(0.76, 1.0, thirtyIn)
        )
        let thirtyLabelIn = easeOutQuint(progress(time, 33.05, 33.55))
        drawImage(
            researchLabelThirty,
            in: context,
            centerX: 1583.5 + lerp(48, 0, thirtyLabelIn),
            centerY: 809.5,
            width: 296,
            height: 91,
            alpha: researchAlpha * thirtyLabelIn
        )

        let sixtyIn = easeOutBack(progress(time, 34.57, 35.15))
        drawImage(
            researchPieSixty,
            in: context,
            centerX: pieCenterX,
            centerY: pieCenterY,
            width: 660,
            height: 660,
            alpha: researchAlpha * sixtyIn,
            scale: lerp(0.76, 1.0, sixtyIn)
        )
        let sixtyLabelIn = easeOutQuint(progress(time, 34.70, 35.30))
        drawImage(
            researchLabelSixty,
            in: context,
            centerX: 1372 + lerp(0, 0, sixtyLabelIn),
            centerY: 280.25 + lerp(-36, 0, sixtyLabelIn),
            width: 530,
            height: 194.5,
            alpha: researchAlpha * sixtyLabelIn
        )

        let researchSubtitleOne = fadeWindow(time, 29.15, 29.45, 33.4, 33.8)
        let researchSubtitleTwo = fadeWindow(time, 33.55, 33.9, 37.65, 38.0)
        drawSubtitle("公开反馈说明，这不是偶发的找车失误。", in: context, y: 1000, color: ink, alpha: researchAlpha * researchSubtitleOne)
        drawSubtitle("六成问题集中在寻找上车点与司机，另外四成带来收费或取消。", in: context, y: 1000, color: ink, alpha: researchAlpha * researchSubtitleTwo)
    }

    // Scene 6: keep the original persona composition intact. Rebuilding the
    // groups and later crossfading to the flattened slide causes a visible jump.
    let personaAlpha = fadeWindow(time, 37.7, 38.25, 45.55, 46.3)
    if personaAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: personaAlpha)
        let pageIn = easeOutQuint(progress(time, 37.9, 39.0))
        drawImage(
            personaFull,
            in: context,
            centerX: 960 + lerp(36, 0, pageIn),
            centerY: 540,
            width: 1920,
            height: 1080,
            alpha: personaAlpha * pageIn
        )

        let personaSubtitleOne = fadeWindow(time, 38.15, 38.45, 41.75, 42.15)
        let personaSubtitleTwo = fadeWindow(time, 41.95, 42.25, 45.5, 45.85)
        drawSubtitle("这些反馈被收束为 Sophia：一位每天往返曼哈顿的通勤者。", in: context, y: 1000, color: ink, alpha: personaAlpha * personaSubtitleOne)
        drawSubtitle("对她来说，每次上车都像在拥挤街区玩一次捉迷藏。", in: context, y: 1000, color: ink, alpha: personaAlpha * personaSubtitleTwo)
    }

    // Scene 7: reduce the problem to two memorable lines.
    let problemAlpha = fadeWindow(time, 45.5, 46.05, 52.7, 53.45)
    if problemAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: problemAlpha)
        let headerIn = easeOutQuint(progress(time, 45.65, 46.35))
        drawClippedImage(problemFull, in: context, clipX: 0, clipY: 0, clipWidth: 1920, clipHeight: 145, centerX: 960, centerY: 540, drawWidth: 1920, drawHeight: 1080, alpha: problemAlpha * headerIn)

        let topIn = easeOutQuint(progress(time, 46.15, 47.75))
        drawClippedImage(problemFull, in: context, clipX: 190, clipY: 180, clipWidth: 1610, clipHeight: 320, centerX: 960 + lerp(-85, 0, topIn), centerY: 540, drawWidth: 1920, drawHeight: 1080, alpha: problemAlpha * topIn)

        let bottomIn = easeOutQuint(progress(time, 48.0, 49.6))
        drawClippedImage(problemFull, in: context, clipX: 190, clipY: 600, clipWidth: 1660, clipHeight: 330, centerX: 960 + lerp(85, 0, bottomIn), centerY: 540, drawWidth: 1920, drawHeight: 1080, alpha: problemAlpha * bottomIn)

        let exactIn = easeOutQuint(progress(time, 49.25, 50.05))
        drawImage(problemFull, in: context, centerX: 960, centerY: 540, width: 1920, height: 1080, alpha: problemAlpha * exactIn)

        let problemSubtitleOne = fadeWindow(time, 45.9, 46.2, 48.9, 49.3)
        let problemSubtitleTwo = fadeWindow(time, 49.15, 49.45, 52.65, 53.0)
        drawSubtitle("在繁忙地点，她找不到哪一辆才是自己的车。", in: context, y: 1000, color: ink, alpha: problemAlpha * problemSubtitleOne)
        drawSubtitle("在陌生地点，她甚至不确定应该站在哪里等。", in: context, y: 1000, color: ink, alpha: problemAlpha * problemSubtitleTwo)
    }

    // Scene 8: contrast the useful recommendation with the missing visual reference.
    let insightAlpha = fadeWindow(time, 52.7, 53.25, 60.65, 61.4)
    if insightAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: insightAlpha)
        let leftIn = easeOutQuint(progress(time, 52.85, 54.35))
        drawClippedImage(insightFull, in: context, clipX: 0, clipY: 0, clipWidth: 1250, clipHeight: 1080, centerX: 960 + lerp(-70, 0, leftIn), centerY: 540, drawWidth: 1920, drawHeight: 1080, alpha: insightAlpha * leftIn)

        let phoneIn = easeOutBack(progress(time, 53.55, 55.75))
        drawClippedImage(insightFull, in: context, clipX: 1260, clipY: 0, clipWidth: 660, clipHeight: 1080, centerX: 960 + lerp(290, 0, phoneIn), centerY: 540, drawWidth: 1920, drawHeight: 1080, alpha: insightAlpha * phoneIn)

        let insightSubtitleOne = fadeWindow(time, 53.05, 53.35, 56.85, 57.2)
        let insightSubtitleTwo = fadeWindow(time, 57.0, 57.3, 60.55, 60.9)
        drawSubtitle("Lyft 会推荐上车点，却仍把判断留给一张抽象地图。", in: context, y: 1000, color: ink, alpha: insightAlpha * insightSubtitleOne)
        drawSubtitle("车越多、参照越少，用户越难确认真实位置。", in: context, y: 1000, color: ink, alpha: insightAlpha * insightSubtitleTwo)
    }

    // Scene 9: one question resets the pacing before the solution.
    let questionAlpha = fadeWindow(time, 60.65, 61.25, 66.1, 66.85)
    if questionAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: questionAlpha)
        let questionIn = easeInOutQuint(progress(time, 60.85, 62.6))
        drawFocusedFullSlide(
            questionFull,
            in: context,
            zoom: lerp(1.08, 1.0, questionIn),
            focusX: 960,
            focusY: 560,
            alpha: questionAlpha * questionIn
        )
        let underline = easeInOutQuint(progress(time, 63.0, 64.5))
        drawLine(context, from: CGPoint(x: 431, y: 683), to: CGPoint(x: lerp(431, 1492, underline), y: 683), color: lyftPink, width: 8, alpha: questionAlpha * underline)
        let questionSubtitle = fadeWindow(time, 61.2, 61.5, 65.95, 66.35)
        drawSubtitle("于是问题被重新定义：用户能不能直接看见司机与上车点？", in: context, y: 1000, color: ink, alpha: questionAlpha * questionSubtitle)
    }

    // Scene 10: matched-object transition from the complete journey to the two
    // intervention points. Shared elements never crossfade against duplicates.
    let journeyAlpha = fadeWindow(time, 66.05, 66.65, 77.2, 78.0)
    if journeyAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: journeyAlpha)
        let contentIn = easeOutQuint(progress(time, 66.35, 68.0))
        let smart = easeInOutQuint(progress(time, 71.0, 74.3))

        drawText(
            "Analyze",
            in: context,
            x: 42,
            y: 49,
            size: 32,
            color: CGColor(gray: 0.36, alpha: 1.0),
            fontName: "HelveticaNeue",
            alpha: journeyAlpha * contentIn * (1.0 - clamp(smart * 2.0))
        )
        drawText(
            "Solution",
            in: context,
            x: 42,
            y: 49,
            size: 32,
            color: CGColor(gray: 0.36, alpha: 1.0),
            fontName: "HelveticaNeue",
            alpha: journeyAlpha * contentIn * clamp(smart * 2.0 - 1.0)
        )

        drawImage(
            journeyCurve,
            in: context,
            centerX: lerp(872, 900, smart),
            centerY: lerp(725, 836, smart),
            width: 1745,
            height: 558,
            alpha: journeyAlpha * contentIn
        )
        drawImage(
            journeyTitle,
            in: context,
            centerX: 960,
            centerY: lerp(971, 968, smart),
            width: 745,
            height: 53,
            alpha: journeyAlpha * contentIn
        )

        let fadingNodes: [(CGImage, Double, Double, Double, Double, Double, Double)] = [
            (profileSettingLabel, 194, 542, 282, 36, 190, 598),
            (vehicleSelectionLabel, 705, 336, 341, 30, 709, 390),
            (driverMatchingLabel, 960, 272, 313, 36, 963, 364),
            (rideExperienceLabel, 1526, 429, 322, 36, 1524, 485),
            (paymentLabel, 1716, 551, 323, 39, 1737, 605)
        ]
        for node in fadingNodes {
            drawImage(
                node.0,
                in: context,
                centerX: node.1,
                centerY: node.2,
                width: node.3,
                height: node.4,
                alpha: journeyAlpha * contentIn * (1.0 - smart)
            )
            drawRoundedRect(
                context,
                x: node.5 - 20,
                y: node.6 - 20,
                width: 40,
                height: 40,
                radius: 20,
                color: CGColor(gray: 0.91, alpha: 1.0),
                alpha: journeyAlpha * contentIn * (1.0 - smart)
            )
        }

        let locationCenterX = lerp(422, 422, smart)
        let locationCenterY = lerp(413, 353, smart)
        drawImage(
            locationSettingLabel,
            in: context,
            centerX: locationCenterX,
            centerY: locationCenterY,
            width: lerp(327, 490, smart),
            height: lerp(36, 53, smart),
            alpha: journeyAlpha * contentIn
        )
        drawRoundedRect(
            context,
            x: lerp(420, 458, smart) - 20,
            y: lerp(469, 468, smart) - 20,
            width: 40,
            height: 40,
            radius: 20,
            color: lyftPink,
            alpha: journeyAlpha * contentIn
        )

        drawImage(
            waitingDriverLabel,
            in: context,
            centerX: lerp(1298, 1397, smart),
            centerY: lerp(350, 353, smart),
            width: lerp(435, 653, smart),
            height: lerp(36, 54, smart),
            alpha: journeyAlpha * contentIn
        )
        drawRoundedRect(
            context,
            x: lerp(1244, 1399, smart) - 20,
            y: lerp(405, 468, smart) - 20,
            width: 40,
            height: 40,
            radius: 20,
            color: lyftPink,
            alpha: journeyAlpha * contentIn
        )

        let journeySubtitleOne = fadeWindow(time, 66.25, 66.55, 70.75, 71.1)
        let journeySubtitleTwo = fadeWindow(time, 71.05, 71.35, 77.05, 77.45)
        drawSubtitle("把完整乘车旅程摊开，摩擦集中在上车前的最后一段。", in: context, y: 1000, color: ink, alpha: journeyAlpha * journeySubtitleOne)
        drawSubtitle("真正需要被强化的，是设置位置与等待司机这两个节点。", in: context, y: 1000, color: ink, alpha: journeyAlpha * journeySubtitleTwo)
    }

    // Scene 11: every moving object is an isolated layer. Moving a crop from the
    // flattened slide would carry neighboring pixels (notably the halo edge).
    let revealAlpha = fadeWindow(time, 77.15, 77.75, 85.34, 85.35)
    if revealAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: revealAlpha)
        let leftIn = easeOutQuint(progress(time, 77.25, 79.15))
        let phoneIn = easeOutBack(progress(time, 77.8, 80.15))
        drawImage(
            ellipse,
            in: context,
            centerX: 1376 + lerp(180, 0, phoneIn),
            centerY: 540,
            width: 952,
            height: 952,
            alpha: revealAlpha * phoneIn,
            scale: lerp(0.94, 1.0, phoneIn)
        )
        drawImage(
            phone,
            in: context,
            centerX: 1377 + lerp(220, 0, phoneIn),
            centerY: 881,
            width: 641,
            height: 1271,
            alpha: revealAlpha * phoneIn
        )
        drawImage(
            logo,
            in: context,
            centerX: 430 + lerp(-160, 0, leftIn),
            centerY: 486,
            width: 434,
            height: 306,
            alpha: revealAlpha * leftIn
        )
        drawImage(
            streetView,
            in: context,
            centerX: 429.5 + lerp(-120, 0, leftIn),
            centerY: 749.5,
            width: 373,
            height: 49,
            alpha: revealAlpha * leftIn
        )

        let solutionSubtitleOne = fadeWindow(time, 77.45, 77.75, 81.55, 81.9)
        let solutionSubtitleTwo = fadeWindow(time, 81.7, 82.0, 85.35, 85.7)
        drawSubtitle("答案是 Street View：把真实街景直接带进等待界面。", in: context, y: 1000, color: ink, alpha: revealAlpha * solutionSubtitleOne)
        drawSubtitle("乘客同时看到路线、附近建筑、上车点与车辆方向。", in: context, y: 1000, color: ink, alpha: revealAlpha * solutionSubtitleTwo)
    }

    // Scene 12: the description enters from below and physically pushes the
    // matched logo/title group upward. The phone and halo stay anchored.
    let detailAlpha = fadeWindow(time, 85.34, 85.35, 95.55, 96.0)
    if detailAlpha > 0.0 {
        fill(context, color: paperWhite, alpha: detailAlpha)
        let smart = easeInOutQuint(progress(time, 85.35, 88.65))

        drawImage(
            ellipse,
            in: context,
            centerX: 1376,
            centerY: 540,
            width: 952,
            height: 952,
            alpha: detailAlpha
        )
        drawImage(
            phone,
            in: context,
            centerX: 1377,
            centerY: 881,
            width: 641,
            height: 1271,
            alpha: detailAlpha
        )
        drawImage(
            logo,
            in: context,
            centerX: lerp(430, 227, smart),
            centerY: lerp(491, 278, smart),
            width: lerp(435, 333, smart),
            height: lerp(307, 235, smart),
            alpha: detailAlpha
        )
        drawImage(
            streetView,
            in: context,
            centerX: lerp(430, 246, smart),
            centerY: lerp(752, 487, smart),
            width: 380,
            height: 49,
            alpha: detailAlpha
        )

        let descriptionIn = easeInOutQuint(progress(time, 86.15, 89.1))
        drawImage(
            solutionDescription,
            in: context,
            centerX: 341,
            centerY: lerp(825, 710, descriptionIn),
            width: 570,
            height: 133,
            alpha: detailAlpha * descriptionIn
        )

        let detailSubtitleOne = fadeWindow(time, 85.65, 85.95, 89.65, 90.0)
        let detailSubtitleTwo = fadeWindow(time, 89.8, 90.1, 95.1, 95.55)
        drawSubtitle("它没有再增加一个标记，而是补上地图缺失的视觉参照。", in: context, y: 1000, color: ink, alpha: detailAlpha * detailSubtitleOne)
        drawSubtitle("少一点猜测，快一点确认，让上车真正回到一步之内。", in: context, y: 1000, color: ink, alpha: detailAlpha * detailSubtitleTwo)
    }

    drawSynchronizedSubtitle(realTime: realTime, in: context)
}

func makePixelBuffer(pool: CVPixelBufferPool) -> CVPixelBuffer {
    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
        fatalError("Unable to allocate pixel buffer: \(status)")
    }
    return buffer
}

func renderSilentVideo() throws {
    removeIfPresent(silentURL)

    let writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 12_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoMaxKeyFrameIntervalKey: 60
        ]
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
        assetWriterInput: input,
        sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: width,
            kCVPixelBufferHeightKey as String: height,
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
        ]
    )

    guard writer.canAdd(input) else { fatalError("Unable to add writer input") }
    writer.add(input)
    guard writer.startWriting() else { throw writer.error ?? NSError(domain: "render", code: 1) }
    writer.startSession(atSourceTime: .zero)

    guard let pool = adaptor.pixelBufferPool else { fatalError("Pixel buffer pool unavailable") }
    let colorSpace = CGColorSpaceCreateDeviceRGB()

    for frame in 0..<frameCount {
        while !input.isReadyForMoreMediaData {
            Thread.sleep(forTimeInterval: 0.002)
        }

        autoreleasepool {
            let buffer = makePixelBuffer(pool: pool)
            CVPixelBufferLockBaseAddress(buffer, [])
            defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

            guard let context = CGContext(
                data: CVPixelBufferGetBaseAddress(buffer),
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
                space: colorSpace,
                bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
            ) else {
                fatalError("Unable to create frame context")
            }
            context.interpolationQuality = .high

            let time = Double(frame) / Double(fps)
            renderFrame(time: time, context: context)
            let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
            if !adaptor.append(buffer, withPresentationTime: presentationTime) {
                fatalError("Failed to append frame \(frame): \(writer.error?.localizedDescription ?? "unknown error")")
            }
        }

        if frame % Int(fps) == 0 {
            print("Rendering \(frame / Int(fps)) / \(Int(duration)) seconds")
        }
    }

    input.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting {
        semaphore.signal()
    }
    semaphore.wait()

    guard writer.status == .completed else {
        throw writer.error ?? NSError(domain: "render", code: 2)
    }
}

func addAudio() throws {
    removeIfPresent(outputURL)

    let videoAsset = AVURLAsset(url: silentURL)
    let musicAsset = AVURLAsset(url: musicURL)
    let composition = AVMutableComposition()

    guard let sourceVideoTrack = videoAsset.tracks(withMediaType: .video).first,
          let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        fatalError("Video track unavailable")
    }
    let videoDuration = CMTime(seconds: duration, preferredTimescale: 600)
    try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoDuration), of: sourceVideoTrack, at: .zero)
    videoTrack.preferredTransform = sourceVideoTrack.preferredTransform

    var audioParameters: [AVMutableAudioMixInputParameters] = []

    if let narrationTrack = composition.addMutableTrack(
        withMediaType: .audio,
        preferredTrackID: kCMPersistentTrackID_Invalid
    ) {
        for cue in timedCues {
            let asset = AVURLAsset(url: cue.url)
            guard let sourceTrack = asset.tracks(withMediaType: .audio).first else {
                fatalError("Narration track unavailable: \(cue.url.lastPathComponent)")
            }
            try narrationTrack.insertTimeRange(
                CMTimeRange(start: .zero, duration: asset.duration),
                of: sourceTrack,
                at: CMTime(seconds: cue.start, preferredTimescale: 600)
            )
        }
        let parameters = AVMutableAudioMixInputParameters(track: narrationTrack)
        parameters.setVolume(1.0, at: .zero)
        audioParameters.append(parameters)
    }

    if let sourceMusicTrack = musicAsset.tracks(withMediaType: .audio).first,
       let musicTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
        var musicCursor = CMTime.zero
        while musicCursor < videoDuration {
            let remaining = CMTimeSubtract(videoDuration, musicCursor)
            let chunk = min(musicAsset.duration, remaining)
            try musicTrack.insertTimeRange(
                CMTimeRange(start: .zero, duration: chunk),
                of: sourceMusicTrack,
                at: musicCursor
            )
            musicCursor = CMTimeAdd(musicCursor, chunk)
        }
        let parameters = AVMutableAudioMixInputParameters(track: musicTrack)
        parameters.setVolume(0.11, at: .zero)
        parameters.setVolumeRamp(
            fromStartVolume: 0.11,
            toEndVolume: 0.045,
            timeRange: CMTimeRange(
                start: CMTime(seconds: max(0, duration - 6.0), preferredTimescale: 600),
                duration: CMTime(seconds: 6.0, preferredTimescale: 600)
            )
        )
        audioParameters.append(parameters)
    }

    let audioMix = AVMutableAudioMix()
    audioMix.inputParameters = audioParameters

    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        fatalError("Unable to create export session")
    }
    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.audioMix = audioMix
    exporter.shouldOptimizeForNetworkUse = true
    exporter.timeRange = CMTimeRange(start: .zero, duration: videoDuration)

    let semaphore = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously {
        semaphore.signal()
    }
    semaphore.wait()

    guard exporter.status == .completed else {
        throw exporter.error ?? NSError(domain: "render", code: 3)
    }
}

do {
    try renderSilentVideo()
    try addAudio()
    removeIfPresent(silentURL)
    print("Full video ready: \(outputURL.path)")
} catch {
    fputs("Render failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}
