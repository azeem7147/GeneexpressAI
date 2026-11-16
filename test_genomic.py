import pandas as pd
from backend.services.genomic_service import genomic_service

print("--- Model 2 Status ---")
print(genomic_service.get_status())
print()

print("--- Running Prediction on test_genomic.csv ---")
df = pd.read_csv("test_genomic.csv")
result = genomic_service.predict(df)

print(result)
