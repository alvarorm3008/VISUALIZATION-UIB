import csv
import json

# Nombre del archivo CSV inicial
csv_file = 'earth_like_exoplanets.csv'  # Asegúrate de que este archivo esté en el mismo directorio
output_json = 'timeline.json'

# Función para convertir valores al tipo adecuado
def convert_value(key, value):
    # Si el valor está vacío, devolver None
    if value == '' or value is None:
        return None
    
    # Convertir números a float donde sea apropiado
    numeric_fields = ['disc_year', 'pl_rade', 'ESI', 'pl_orbper', 'pl_orbsmax', 
                     'pl_bmasse', 'pl_bmassj', 'pl_orbeccen', 'pl_insol', 'pl_eqt',
                     'st_teff', 'st_rad', 'st_mass', 'st_met', 'st_logg', 
                     'sy_dist', 'sy_vmag', 'sy_kmag', 'sy_gaiamag']
    
    try:
        if key in numeric_fields:
            if key == 'disc_year':
                return int(value)  # Año como entero
            else:
                return float(value)  # Resto como float
        
        # Boolean fields
        if key in ['default_flag', 'pl_controv_flag', 'ttv_flag']:
            return int(value) == 1
        
        # Mantener el resto como string
        return value
    except (ValueError, TypeError):
        # Si hay error de conversión, devolver el valor original
        return value

# Leer el archivo CSV y procesar los datos
planets_by_year = {}
with open(csv_file, 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    # Obtener los nombres de todas las columnas
    fieldnames = reader.fieldnames
    
    for row in reader:
        # Verificar que el año exista
        if not row['disc_year']:
            continue  # Saltar filas sin año
            
        year = int(row['disc_year'])
        
        # Crear un diccionario con todos los campos, convirtiendo al tipo adecuado
        planet_data = {field: convert_value(field, row[field]) for field in fieldnames}
        
        # Si el año no está en el diccionario, inicializar la lista
        if year not in planets_by_year:
            planets_by_year[year] = []
            
        # Agregar el planeta a la lista del año correspondiente
        planets_by_year[year].append(planet_data)

# Convertir el diccionario a una lista ordenada por año
timeline = []
for year in sorted(planets_by_year.keys()):
    # Ordenar planetas por ESI dentro de cada año (descendente)
    sorted_planets = sorted(planets_by_year[year], key=lambda x: x.get('ESI', 0) or 0, reverse=True)
    timeline.extend(sorted_planets)

# Guardar los datos en un archivo JSON
with open(output_json, 'w', encoding='utf-8') as file:
    json.dump(timeline, file, indent=4)

print(f"Archivo {output_json} generado correctamente con {len(timeline)} planetas y todos los campos del CSV.")