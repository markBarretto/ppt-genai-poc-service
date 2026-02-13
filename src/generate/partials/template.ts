export const template: string = `
Format the presentation into the provided json structure.

Each object in the array is a slide template type.

The unique identifier for each slide template is the templateName property. The contentSection property describes which template sections are available for the template.

Make sure when specifying a slide template type, the sections used actually exists in the contentSection of the slide template

Slide templates do not need to be in the order defined in the json template. Slide templates can also be re used based on content structure

Condense salutation slide template text to 15 characters

template:
[
    {
        "templateName":"cover", 
        "contentSections": {
            "title": "",
            "subtitle": "",
            "presenter": "",
            "date": ""
        }
    },
    {   
        "templateName":"agenda_with_image", 
        "contentSections": {
            "title":"",
            "picture":"",
            "bullet1":"",
            "bullet2":"",
            "bullet3":"",
            "bullet4":"",
            "bullet5":"",
            "bullet6":"",
            "bullet7":"",
            "bullet8":"",
            "bullet9":""
        }
    },
    {
        "templateName":"executive_summary_with_one_image",
        "contentSections": {
            "picture":"",
            "title":"",
            "text":""
        }
    },
    {
        "templateName":"key_message_01_with_one_image", 
        "contentSections":{
            "text":"",
            "picture":""
        }
    },
    {
        "templateName":"key_message_02_white_backgroud", 
        "contentSections":{
            "text":""
        }
    },
    {
        "templateName":"key_message_03_dark_backgroud", 
        "contentSections":{
            "text":""
        }
    },
    {
        "templateName":"contentSections_01_with_one_image", 
        "contentSections":{
            "text":"",
            "picture":"",
            "title":""
        }
    },
    {
        "templateName":"contentSections_02_no_image", 
        "contentSections":{
            "title":"",
            "subtitle":"",
            "text":""
        }
    },
    {
        "templateName":"contentSections_03_with_one_image", 
        "contentSections":{
            "title":"",
            "text":"",
            "picture":""
        }
    },
    {
        "templateName":"contentSections_04_with_one_image", 
        "contentSections":{
            "title":"",
            "subtitle":"",
            "text":"",
            "picture":""
        }
    },
    {
        "templateName":"salutation", 
        "contentSections":{
            "text":""
        }
    },
    {
        "templateName":"onepager_1", 
        "contentSections":{
            "title":"",
            "subtitle":"",
            "text":"",
            "subtitle1":"",
            "text1":"",
            "subtitle2":"",
            "text2":"",
            "subtitle3":"",
            "text3":"",
            "picture":""
        }
    },
    {
        "templateName":"onepager_2", 
        "contentSections":{
            "title":"",
            "subtitle":"",
            "highlight":"",
            "text":"",
            "highlight1":"",
            "text1":"",
            "highlight2":"",
            "text2":"",
            "highlight3":"",
            "text3":"",
            "picture":""
        }
    }
]
`