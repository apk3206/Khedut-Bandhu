@echo off
title Training AI Model - PlantVillage
color 0B

echo.
echo  =====================================================
echo   KHEDUT BANDHU - AI MODEL TRAINING
echo   Dataset: backend/plantvillage/
echo   Target : 90 percent+ Accuracy
echo   Model  : EfficientNetB3 Transfer Learning
echo  =====================================================
echo.
echo  IMPORTANT: Place your PlantVillage images in:
echo    D:\frontend\react_project_091\backend\plantvillage\
echo    Each disease should have its own sub-folder.
echo    Example:
echo      plantvillage\Wheat_loose_smut\img1.jpg
echo      plantvillage\Tomato_early_blight__fungal_\img1.jpg
echo.
echo  Starting training in 5 seconds...
timeout /t 5 /nobreak >nul

cd /d D:\frontend\react_project_091
echo.
echo  [1/2] Generating robust synthetic PlantVillage dataset...
call myenv\Scripts\python.exe build_plantvillage.py

echo.
echo  [2/2] Training Neural Network (MobileNetV2)...
call myenv\Scripts\python.exe train_plantvillage.py

echo.
echo  Training complete! Restart AI service to use new model.
echo  Run START_KHEDUT.bat to launch all services.
echo.
pause
