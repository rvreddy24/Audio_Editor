Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Audio Editor"

On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.open "GET", "http://localhost:5000/api/health", False
http.setTimeouts 500, 500, 500, 500
http.send

If Err.Number <> 0 Then
    ' Server is not running, launch node server hidden (0 = hide window)
    WshShell.Run """C:\Program Files\nodejs\node.exe"" ""D:\Audio Editor\server\index.js""", 0, False
    WScript.Sleep 1200
End If
On Error GoTo 0

' Launch default web browser to SoundCraft Studio
WshShell.Run "cmd /c start http://localhost:5000", 0, False
