# Directory Update

## Change Made

Updated the CLI project generator to use `agen/gen-projects` instead of `agen/projects` for generated projects.

## Files Updated

1. **src/generators/project-generator.ts** - Updated projectsDir path
2. **src/utils/project-env-helper.ts** - Updated projectsDir path and PROJECT_PATH in env template
3. **README.md** - Updated project structure documentation
4. **QUICK-START.md** - Updated project structure example
5. **IMPLEMENTATION-SUMMARY.md** - Updated project creation documentation
6. **demo.bat** - Added note about new directory location

## Directory Created

- Created `c:\dev\code-craft\agen\gen-projects` directory

## Result

Now when you create projects, they will be placed in:

```
agen/gen-projects/{project-name}/
├── backend/
└── frontend/
```

Instead of the old location:

```
agen/projects/{project-name}/
```

The CLI has been rebuilt and is ready to use with the new directory structure.
