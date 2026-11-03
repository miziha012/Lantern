# Project instructions

- Keep project files under D:\Lantern with English folder names.
- Develop and verify locally by default. Do not push to GitHub, create or publish releases, or upload build artifacts unless the user explicitly requests publishing the current revision. Prior releases do not authorize publishing later revisions.
- Automated desktop tests must set LANTERN_DISCOVERY=0 so isolated test identities never broadcast onto the user network.
- After every program change, provide the exact executable path for the newly verified build, or launch that build when appropriate. Never leave the user to distinguish old and new build directories.
- When delivering a verified local build, update D:\Lantern\Lantern.lnk to that exact executable so the shared startup entry never opens an older build.
