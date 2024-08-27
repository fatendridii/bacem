from flask import Flask, jsonify
from pymongo import MongoClient
import pandas as pd

app = Flask(__name__)

client = MongoClient('mongodb+srv://massarrabenjebiri:VLafkV0BnzehFsOy@cluster0.34hr6si.mongodb.net/')
db = client['test']
collection = db['moduletrackings']
modules_collection = db['modules']  

@app.route('/analytics/completion_rate', methods=['GET'])
def completion_rate():
    data = pd.DataFrame(list(collection.find()))
    modules = pd.DataFrame(list(modules_collection.find()))
    modules = modules.rename(columns={'_id': 'moduleId', 'title': 'moduleTitle'})
    
    data['moduleId'] = data['moduleId'].astype(str)
    modules['moduleId'] = modules['moduleId'].astype(str)
    
    data = pd.merge(data, modules, on='moduleId')
    
    completion_rate = data.groupby('moduleTitle', group_keys=False).apply(lambda x: x['endTime'].notnull().mean()).reset_index(name='completion_rate')
    return jsonify(completion_rate.to_dict(orient='records'))

@app.route('/analytics/average_time_spent', methods=['GET'])
def average_time_spent():
    data = pd.DataFrame(list(collection.find()))
    modules = pd.DataFrame(list(modules_collection.find()))
    modules = modules.rename(columns={'_id': 'moduleId', 'title': 'moduleTitle'})
    
    data['moduleId'] = data['moduleId'].astype(str)
    modules['moduleId'] = modules['moduleId'].astype(str)
    
    data = pd.merge(data, modules, on='moduleId')
    
    data['time_spent'] = data['endTime'] - data['startTime']
    data['time_spent_minutes'] = data['time_spent'].dt.total_seconds() / 60  
    data['time_spent_minutes'] = data['time_spent_minutes'].round(2)
    average_time_spent = data.groupby('moduleTitle', group_keys=False)['time_spent_minutes'].mean().reset_index(name='average_time_spent_minutes')
    return jsonify(average_time_spent.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
