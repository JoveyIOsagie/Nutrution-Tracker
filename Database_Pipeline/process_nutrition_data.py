import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline

# --- Custom Transformer Definitions ---

class PivotNutrientsTransformer(BaseEstimator, TransformerMixin):
    """
    Transforms the food nutrient data from a long format (one nutrient per row)
    to a wide format (one food per row with nutrients as columns).
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        # This transformer doesn't need to learn anything from the data
        return self

    def transform(self, X, y=None):
        """Pivots the DataFrame."""
        print("Step 1: Pivoting data to wide format...")
        if not isinstance(X, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")
        
        # Pivot the table to make unique fdc_ids into rows and nutrient_ids into columns
        # The value in each cell will be the nutrient 'amount'
        pivoted_df = X.pivot_table(
            index='fdc_id',
            columns='nutrient_id',
            values='amount',
            aggfunc='first'  # Use 'first' in case of any duplicate nutrient entries for a food
        )
        # Reset the index to turn 'fdc_id' back into a column for the next steps
        pivoted_df = pivoted_df.reset_index()
        print("Pivoting complete.")
        return pivoted_df

class RenameNutrientFeaturesTransformer(BaseEstimator, TransformerMixin):
    """
    Renames the nutrient_id columns to a descriptive format using the nutrient.csv file.
    The new format is 'NutrientName_UnitName'.
    """
    def __init__(self, nutrient_filepath):
        self.nutrient_filepath = nutrient_filepath
        self.nutrient_map = {}

    def fit(self, X, y=None):
        """Loads the nutrient.csv data and creates a mapping for renaming."""
        print("Step 2: Fitting feature renamer (loading nutrient names)...")
        try:
            nutrient_df = pd.read_csv(self.nutrient_filepath)
        except FileNotFoundError:
            print(f"Error: The file {self.nutrient_filepath} was not found.")
            raise

        # Create the mapping dictionary: {nutrient_id: 'name_unit_name'}
        self.nutrient_map = nutrient_df.set_index('id').apply(
            lambda row: f"{row['name']}_{row['unit_name']}", axis=1
        ).to_dict()
        print("Nutrient name mapping created.")
        return self

    def transform(self, X, y=None):
        """Renames the columns of the DataFrame."""
        print("Step 2: Transforming feature names...")
        if not isinstance(X, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        # Create a specific renaming dictionary for the columns present in the input DataFrame
        # This handles columns that are nutrient IDs while ignoring others like 'fdc_id'
        rename_dict = {
            col: self.nutrient_map.get(col, f"unknown_nutrient_{col}")
            for col in X.columns if isinstance(col, (int, float))
        }

        renamed_df = X.rename(columns=rename_dict)
        print("Feature names transformed.")
        return renamed_df

class EnrichFoodInfoTransformer(BaseEstimator, TransformerMixin):
    """
    Replaces fdc_id with food description and adds other food-related features
    from the food.csv file.
    """
    def __init__(self, food_filepath):
        self.food_filepath = food_filepath
        self.food_info_df = None

    def fit(self, X, y=None):
        """Loads the food.csv data for enrichment."""
        print("Step 3: Fitting food info enricher (loading food descriptions)...")
        try:
            # Load only the necessary columns from food.csv
            self.food_info_df = pd.read_csv(
                self.food_filepath,
                usecols=['fdc_id', 'description', 'food_category_id', 'publication_date']
            )
        except FileNotFoundError:
            print(f"Error: The file {self.food_filepath} was not found.")
            raise
        print("Food description data loaded.")
        return self

    def transform(self, X, y=None):
        """Merges food info, replaces fdc_id, and reorders columns."""
        print("Step 3: Enriching data with food descriptions...")
        if not isinstance(X, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")
        
        # Merge the main data with the food info DataFrame
        enriched_df = pd.merge(self.food_info_df, X, on='fdc_id', how='right')
        
        # Get a list of the nutrient columns
        nutrient_cols = [col for col in enriched_df.columns if col not in 
                         ['fdc_id', 'description', 'food_category_id', 'publication_date']]
        
        # Define the final column order, replacing fdc_id with description as the identifier
        final_cols = ['description', 'food_category_id', 'publication_date'] + nutrient_cols
        
        final_df = enriched_df[final_cols]
        print("Food info enrichment complete.")
        return final_df

# --- Main Execution Block ---

if __name__ == '__main__':
    # --- Configuration ---
    FOOD_NUTRIENT_PATH = 'food_nutrient.csv'
    NUTRIENT_PATH = 'nutrient.csv'
    FOOD_PATH = 'food.csv'
    OUTPUT_PATH = 'Nutrition_Database.csv'

    print("Starting the nutrition data processing script.")

    # --- Data Loading ---
    print(f"Loading main data file: {FOOD_NUTRIENT_PATH}...")
    try:
        # To minimize memory usage, load only the essential columns from the large file
        food_nutrient_df = pd.read_csv(
            FOOD_NUTRIENT_PATH,
            usecols=['fdc_id', 'nutrient_id', 'amount']
        )
        print("Main data file loaded successfully.")
    except MemoryError:
        print("\n--- 🚨 MEMORY ERROR ---")
        print(f"The file '{FOOD_NUTRIENT_PATH}' is too large to fit into your computer's RAM.")
        print("Please run this script on a machine with more memory or adapt it to use a chunking strategy.")
        exit()
    except FileNotFoundError:
        print(f"\n--- 🔎 FILE NOT FOUND ---")
        print(f"Error: Could not find '{FOOD_NUTRIENT_PATH}'.")
        print("Please ensure all required CSV files (food_nutrient.csv, nutrient.csv, food.csv) are in the same directory.")
        exit()

    # --- Pipeline Definition ---
    print("\nDefining the processing pipeline...")
    # This pipeline chains our custom transformers together in the correct order
    nutrition_pipeline = Pipeline([
        ('pivot_data', PivotNutrientsTransformer()),
        ('rename_features', RenameNutrientFeaturesTransformer(nutrient_filepath=NUTRIENT_PATH)),
        ('enrich_data', EnrichFoodInfoTransformer(food_filepath=FOOD_PATH))
    ])

    # --- Pipeline Execution ---
    print("\nExecuting the pipeline... This may take several minutes. ⏳")
    # The fit_transform method will execute all steps in the pipeline sequentially
    final_df = nutrition_pipeline.fit_transform(food_nutrient_df)
    
    # --- Save Output ---
    print("\n✅ Pipeline execution finished.")
    print(f"Saving the final data to {OUTPUT_PATH}...")
    final_df.to_csv(OUTPUT_PATH, index=False)
    print(f"Success! The file '{OUTPUT_PATH}' has been created.")
