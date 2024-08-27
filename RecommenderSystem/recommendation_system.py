from flask import Flask, jsonify
from pymongo import MongoClient
from bson import ObjectId
import re

app = Flask(__name__)

client = MongoClient('mongodb+srv://massarrabenjebiri:VLafkV0BnzehFsOy@cluster0.34hr6si.mongodb.net/')
db = client['test']
courses_collection = db['courses']

def load_courses():
    
    courses = {}
    all_courses = courses_collection.find({}, {'title': 1, 'sousTitre': 1, 'description': 1, 'apprendreCours': 1, 'image': 1})
    for course in all_courses:
        course_id = str(course['_id'])  
        courses[course_id] = course
    return courses

def load_recommendations():
   
    courses = {}

    all_courses = load_courses()

    for course_id, course in all_courses.items():
        keywords = extract_keywords(course)
        courses[course_id] = {
            '_id': course['_id'],
            'title': course['title'],
            'sousTitre': course.get('sousTitre', ''),
            'description': course['description'],
            'apprendreCours': course['apprendreCours'],
            'image': course['image'],
            'keywords': list(keywords)
        }

    return courses

def extract_keywords(course):
    keywords = set()

    for field in ['title', 'sousTitre', 'description', 'apprendreCours']:
        if field in course and course[field]:
            words = re.findall(r'\b\w+\b', course[field].lower())
            keywords.update(words)

    return keywords

def recommend_similar_courses(course_id):
    courses = load_recommendations()
    current_course_keywords = set(courses[course_id]['keywords'])

    recommended_courses = []

    for cid, course in courses.items():
        if cid != course_id:
            if current_course_keywords.intersection(course['keywords']):
                recommended_courses.append(course)

    return recommended_courses

@app.route('/api/recommendations/<course_id>', methods=['GET'])
def get_recommendations(course_id):
    try:
        recommended_courses = recommend_similar_courses(course_id)
        recommendations = []
        for course in recommended_courses:
            recommendations.append({
                'course_id': str(course['_id']),
                '_id': str(course['_id']),
                'title': course['title'],
                'sousTitre': course['sousTitre'],
                'description': course['description'],
                'apprendreCours': course['apprendreCours'],
                'image': course['image']
            })
        return jsonify({'recommendations': recommendations}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
