import unittest
from server import app
import json

class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_calendar_post_and_get(self):
        
        event = {
            "id": "test123",
            "date": str(1720000000000),
            "title": "Test Workout",
            "type": "cardio",
            "duration": 30
        }
        response = self.client.post("/calendar", json=event)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "success")

        
        get_response = self.client.get("/calendar")
        self.assertEqual(get_response.status_code, 200)
        events = json.loads(get_response.data)
        self.assertTrue(any(e.get("id") == "test123" for e in events))

    def test_chat_response(self):
        response = self.client.post("/chat", json={"message": "What's a good leg workout?"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("reply", data)

if __name__ == '__main__':
    unittest.main()