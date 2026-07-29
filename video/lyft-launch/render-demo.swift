import AppKit
import AVFoundation
import CoreGraphics
import CoreText
import CoreVideo

let width = 1920
let height = 1080
let fps: Int32 = 30
let duration = 30.0
let frameCount = Int(duration * Double(fps))

let source = URL(fileURLWithPath: "/Users/aixuewang/Downloads/LyftPPT")
let outputDirectory = URL(fileURLWithPath: "/Users/aixuewang/Documents/ash-portfolio/video/lyft-launch")
let silentURL = outputDirectory.appendingPathComponent("lyft-demo-silent.mp4")
let outputURL = outputDirectory.appendingPathComponent("lyft-street-view-demo.mp4")
let narrationURL = outputDirectory.appendingPathComponent("narration-demo.aiff")
let musicURL = outputDirectory.appendingPathComponent("music-demo.wav")

let lyftPink = CGColor(red: 1.0, green: 0.0, blue: 0.67, alpha: 1.0)
let ink = CGColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1.0)
let softWhite = CGColor(red: 0.97, green: 0.97, blue: 0.98, alpha: 1.0)

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

func drawSubtitle(
    _ text: String,
    in context: CGContext,
    y: Double,
    color: CGColor,
    alpha: Double
) {
    drawText(
        text,
        in: context,
        x: 960,
        y: y + 3,
        size: 32,
        color: CGColor(gray: color == softWhite ? 0.0 : 1.0, alpha: 1.0),
        fontName: "PingFangSC-Medium",
        alpha: alpha * 0.30,
        centered: true
    )
    drawText(
        text,
        in: context,
        x: 960,
        y: y,
        size: 32,
        color: color,
        fontName: "PingFangSC-Medium",
        alpha: alpha,
        centered: true
    )
}

func renderFrame(time: Double, context: CGContext) {
    fill(context, color: softWhite)

    // Scene 1: reveal the original composition in place, then push into the phone.
    let sceneOneAlpha = fadeWindow(time, 0.0, 0.18, 6.15, 6.95)
    if sceneOneAlpha > 0.0 {
        let phoneGroupIn = easeOutQuint(progress(time, 0.10, 2.15))
        let logoIn = easeOutQuint(progress(time, 0.45, 1.95))
        let titleIn = easeOutQuint(progress(time, 1.05, 2.55))

        if time < 5.15 {
            drawClippedImage(
                coverFull,
                in: context,
                clipX: 860,
                clipY: 0,
                clipWidth: 1060,
                clipHeight: 1080,
                centerX: 960 + lerp(125, 0, phoneGroupIn),
                centerY: 540 + lerp(55, 0, phoneGroupIn),
                drawWidth: 1920,
                drawHeight: 1080,
                alpha: sceneOneAlpha * phoneGroupIn
            )
            drawClippedImage(
                coverFull,
                in: context,
                clipX: 0,
                clipY: 140,
                clipWidth: 760,
                clipHeight: 570,
                centerX: 960 + lerp(-115, 0, logoIn),
                centerY: 540,
                drawWidth: 1920,
                drawHeight: 1080,
                alpha: sceneOneAlpha * logoIn
            )
            drawClippedImage(
                coverFull,
                in: context,
                clipX: 0,
                clipY: 680,
                clipWidth: 820,
                clipHeight: 270,
                centerX: 960,
                centerY: 540 + lerp(52, 0, titleIn),
                drawWidth: 1920,
                drawHeight: 1080,
                alpha: sceneOneAlpha * titleIn
            )
            let settle = easeOutQuint(progress(time, 2.9, 3.8))
            drawImage(coverFull, in: context, centerX: 960, centerY: 540, width: 1920, height: 1080, alpha: sceneOneAlpha * settle)
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

    // Short end lockup that leaves room for the next chapter.
    let outro = easeInOutQuint(progress(time, 29.0, 29.65))
    if outro > 0.0 {
        fill(context, color: lyftPink, alpha: outro)
        let titleIn = easeOutQuint(progress(time, 29.35, 29.9))
        drawText("LYFT STREET VIEW", in: context, x: 960, y: 452, size: 34, color: softWhite, tracking: 6.0, alpha: titleIn, centered: true)
        drawText("PROBLEM / OBSERVED", in: context, x: 960, y: 514, size: 18, color: softWhite, fontName: "PingFangSC-Regular", tracking: 4.0, alpha: titleIn * 0.7, centered: true)
    }
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
    let narrationAsset = AVURLAsset(url: narrationURL)
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

    if let sourceNarrationTrack = narrationAsset.tracks(withMediaType: .audio).first,
       let narrationTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
        let narrationDuration = min(narrationAsset.duration, CMTime(seconds: duration - 0.25, preferredTimescale: 600))
        try narrationTrack.insertTimeRange(
            CMTimeRange(start: .zero, duration: narrationDuration),
            of: sourceNarrationTrack,
            at: CMTime(seconds: 0.25, preferredTimescale: 600)
        )
        let parameters = AVMutableAudioMixInputParameters(track: narrationTrack)
        parameters.setVolume(1.0, at: .zero)
        audioParameters.append(parameters)
    }

    if let sourceMusicTrack = musicAsset.tracks(withMediaType: .audio).first,
       let musicTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
        try musicTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoDuration), of: sourceMusicTrack, at: .zero)
        let parameters = AVMutableAudioMixInputParameters(track: musicTrack)
        parameters.setVolume(0.11, at: .zero)
        parameters.setVolumeRamp(fromStartVolume: 0.11, toEndVolume: 0.06, timeRange: CMTimeRange(start: CMTime(seconds: 28.0, preferredTimescale: 600), duration: CMTime(seconds: 2.0, preferredTimescale: 600)))
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
    print("Demo ready: \(outputURL.path)")
} catch {
    fputs("Render failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}
