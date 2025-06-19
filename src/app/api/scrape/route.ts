import { NextResponse } from 'next/server';
import { scrapeBlogPosts } from '@/lib/scraper';
import { ScrapeConfig } from '@/types/scraper';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Temporarily disabled auth check for testing
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // if (authError) {
    //   console.error('Authentication error:', authError);
    //   return NextResponse.json(
    //     { error: 'Authentication error: ' + authError.message },
    //     { status: 401 }
    //   );
    // }

    // if (!user) {
    //   console.error('No authenticated user found');
    //   return NextResponse.json(
    //     { error: 'Please sign in to use this feature' },
    //     { status: 401 }
    //   );
    // }

    // console.log('Authenticated user:', user.id);

    const { config } = await request.json() as { config: ScrapeConfig };
    
    if (!config || !config.url || !config.knowledge_base_id) {
      return NextResponse.json(
        { error: 'Invalid configuration' },
        { status: 400 }
      );
    }

    console.log('Starting scrape with config:', config);
    
    // Use scrapeBlogPosts to get multiple items
    const posts = await scrapeBlogPosts(config);
    console.log(`Scraped ${posts.length} posts`);

    // Store each post in the database
    const storedPosts = [];
    console.log('Starting to store posts in database...');
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`Storing post ${i + 1}/${posts.length}: ${post.title}`);
      
      const { data: entry, error } = await supabase
        .from('knowledge_entries')
        .insert({
          knowledge_base_id: config.knowledge_base_id,
          title: post.title,
          content: post.excerpt, // Using excerpt as content for now
          source_url: post.url,
          source_type: 'blog',
          metadata: {
            author: post.author,
            date: post.date,
            source: post.source
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing post:', error);
        continue; // Skip this post but continue with others
      }

      storedPosts.push(entry);
      console.log(`Successfully stored post ${i + 1}`);
    }

    console.log(`Completed! Stored ${storedPosts.length} out of ${posts.length} posts`);

    return NextResponse.json({ 
      content: posts,
      stored: storedPosts.length,
      total: posts.length
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape content' },
      { status: 500 }
    );
  }
} 