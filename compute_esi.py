import pandas as pd
import numpy as np

# Cargar el dataset
df = pd.read_csv("nasa_all.csv", comment="#")

# Valores de referencia de la Tierra y pesos
earth = {
    'pl_rade': 1.0,
    'density': 5.51,
    'escape_velocity': 11.2,
    'pl_eqt': 288
}

weights = {
    'pl_rade': 0.57,
    'density': 1.07,
    'escape_velocity': 0.70,
    'pl_eqt': 5.58
}

# Función para calcular el ESI de forma segura
def calculate_esi(row):
    try:
        # Verificar si los valores necesarios están presentes
        if pd.isna(row['pl_rade']) or pd.isna(row['pl_bmasse']) or pd.isna(row['pl_eqt']):
            return np.nan

        # Calcular propiedades derivadas
        radius = row['pl_rade']
        mass = row['pl_bmasse']
        temp = row['pl_eqt']

        density = (mass / radius**3) * 5.51
        escape_velocity = 11.2 * np.sqrt(mass / radius)

        # Combinar en un diccionario para facilitar el manejo
        values = {
            'pl_rade': radius,
            'density': density,
            'escape_velocity': escape_velocity,
            'pl_eqt': temp
        }

        # Calcular el ESI
        esi = 1.0
        for var in values:
            xi = values[var]
            xi_earth = earth[var]
            wi = weights[var]
            esi *= (1 - abs((xi - xi_earth) / (xi + xi_earth))) ** wi

        return esi

    except Exception:
        return np.nan

# Aplicar la función de ESI a todo el dataset
df['ESI'] = df.apply(calculate_esi, axis=1)

# Filtrar planetas con ESI >= 0.35
filtered_df = df[df['ESI'] >= 0.25]

# Seleccionar el planeta con mayor ESI de 2012 y 2013
years_to_check = [2012, 2013]
top_planets = []

for year in years_to_check:
    year_df = df[df['disc_year'] == year]
    if not year_df.empty:
        # Seleccionar el planeta con el mayor ESI de ese año
        top_planet = year_df.loc[year_df['ESI'].idxmax()]
        top_planets.append(top_planet)

# Convertir los planetas seleccionados a un DataFrame
top_planets_df = pd.DataFrame(top_planets)

# Combinar los planetas filtrados con los planetas seleccionados de 2012 y 2013
final_df = pd.concat([filtered_df, top_planets_df]).drop_duplicates()

# Guardar los resultados en un nuevo archivo CSV
final_df.to_csv("earth_like_exoplanets.csv", index=False)

# Imprimir el conteo de planetas filtrados
print(f"🌍 Se encontraron {len(filtered_df)} planetas con ESI >= 0.35.")
print(f"🌟 Se añadieron {len(top_planets)} planetas con el mayor ESI de 2012 y 2013.")
print(f"📁 Resultados guardados en 'filtered_exoplanets_with_top_2012_2013.csv'.")