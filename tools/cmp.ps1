param(
  [int]$X = 0, [int]$Y = 0, [int]$W = 1254, [int]$H = 1254,
  [int]$OutW = 620, [string]$Tag = "cmp",
  [string]$Shot = "E:\award\_live.png"
)
Add-Type -AssemblyName System.Drawing
$a = [System.Drawing.Image]::FromFile("E:\award\design.png")
$b = [System.Drawing.Image]::FromFile($Shot)
$scale = $OutW / $W
$ch = [int]($H * $scale)
$out = New-Object System.Drawing.Bitmap($OutW, ($ch * 2 + 6))
$g = [System.Drawing.Graphics]::FromImage($out)
$g.Clear([System.Drawing.Color]::Magenta)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($a, (New-Object System.Drawing.Rectangle(0, 0, $OutW, $ch)), (New-Object System.Drawing.Rectangle($X, $Y, $W, $H)), 'Pixel')
$g.DrawImage($b, (New-Object System.Drawing.Rectangle(0, ($ch + 6), $OutW, $ch)), (New-Object System.Drawing.Rectangle($X, $Y, $W, $H)), 'Pixel')
$g.Dispose()
$p = "E:\award\_$Tag.png"
$out.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose(); $a.Dispose(); $b.Dispose()
"saved $p  (top=design, bottom=live)"
